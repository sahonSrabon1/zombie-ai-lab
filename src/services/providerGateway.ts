// ─── Provider Gateway ───────────────────────────────────────────────────────
// Smart provider selection with database configuration, environment fallback,
// and automatic fallback chain. Settings cached with configurable TTL.

import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { ProviderFactory } from '@/providers/ProviderFactory';
import type { ILLMProvider, ProviderResponse } from '@/providers/IProvider';
import { ProviderError } from '@/providers/IProvider';
import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';

const logger = createLogger('provider-gateway');

interface CachedProvider {
  provider: ILLMProvider;
  createdAt: number;
}

interface CachedSettings {
  settings: {
    activeProviderId: string | null;
    activeProviderType: string | null;
  };
  createdAt: number;
}

export class ProviderGateway {
  private cache = new Map<string, CachedProvider>();
  private settingsCache: CachedSettings | null = null;
  private readonly settingsCacheTtl: number;
  private readonly providerCacheTtl: number;

  constructor() {
    this.settingsCacheTtl = Number(process.env.PROVIDER_SETTINGS_CACHE_TTL_MS) || 2000;
    this.providerCacheTtl = 300000; // 5 minutes
  }

  // ─── Provider Resolution ─────────────────────────────────────────────────

  /**
   * Get the active provider, resolving through:
   * 1. Specific providerId (if provided)
   * 2. Database active provider setting
   * 3. Environment variables
   *
   * IMPORTANT: No silent fallback to localhost services.
   * If no provider is configured, a clear error is thrown.
   */
  async getActiveProvider(providerId?: string): Promise<ILLMProvider> {
    // If specific provider requested
    if (providerId) {
      return this.getProviderById(providerId);
    }

    // Check database for active provider
    try {
      const dbProvider = await this.getActiveProviderFromDB();
      if (dbProvider) {
        return dbProvider;
      }
    } catch (error) {
      logger.warn('Database provider lookup failed, falling back to env', { error });
    }

    // If DB has providers configured but none active, do NOT silently fall back.
    const configuredCount = await db.aiProvider.count();
    if (configuredCount > 0) {
      throw new Error(
        'No active AI provider selected. Please activate a provider in the Providers panel. ' +
        'The system will not silently fall back to a local provider when providers are configured.'
      );
    }

    // Check environment variables
    const envProvider = this.getProviderFromEnv();
    if (envProvider) {
      return envProvider;
    }

    // No provider configured — throw a clear error instead of silently calling localhost
    throw new Error(
      'No AI provider configured. Please add and activate a provider in the Providers panel, ' +
      'or set the OLLAMA_BASE_URL environment variable. The system does not call any AI service directly — ' +
      'all traffic must route through a configured provider via the Public Gateway.'
    );
  }

  // ─── Chat Completions ────────────────────────────────────────────────────

  private isRetryableStatus(status?: number): boolean {
    return status === 429 || status === 503 || status === 504;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async chatWithRetry(
    provider: ILLMProvider,
    messages: ChatMessage[],
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<ProviderResponse> {
    const maxAttempts = Number(process.env.PROVIDER_CHAT_MAX_ATTEMPTS) || 3;
    const baseDelayMs = Number(process.env.PROVIDER_CHAT_RETRY_BASE_DELAY_MS) || 350;

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await provider.chat(messages, options);
      } catch (err) {
        lastError = err;

        if (!(err instanceof ProviderError) || !this.isRetryableStatus(err.statusCode)) {
          throw err;
        }

        if (attempt === maxAttempts) {
          throw err;
        }

        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        logger.warn('Retryable provider error, backing off', {
          provider: provider.name,
          providerType: provider.type,
          statusCode: err.statusCode,
          attempt,
          maxAttempts,
          delayMs: delay,
        });
        await this.sleep(delay);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Provider chat failed');
  }

  async chat(
    messages: ChatMessage[],
    options?: {
      providerId?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<ProviderResponse> {
    const start = Date.now();
    const provider = await this.getActiveProviderWithModel(options?.providerId, options?.model);

    try {
      const response = await this.chatWithRetry(provider, messages, {
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });

      const latency = Date.now() - start;
      if (process.env.PROVIDER_LATENCY_DEBUG === 'true') {
        logger.info('Chat completion latency', {
          provider: provider.name,
          model: response.model,
          latencyMs: latency,
          tokenCount: response.tokenCount,
        });
      }

      return response;
    } catch (error) {
      logger.error('Chat completion failed', error as Error, {
        provider: provider.name,
        messageType: messages[messages.length - 1]?.role,
      });
      throw error;
    }
  }

  async chatStream(
    messages: ChatMessage[],
    options: {
      providerId?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      model?: string;
      onChunk: (chunk: StreamChunk) => void;
    }
  ): Promise<StreamChunk> {
    const provider = await this.getActiveProviderWithModel(options?.providerId, options?.model);

    try {
      return await provider.chatStream(messages, {
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        onChunk: options.onChunk,
      });
    } catch (error) {
      logger.error('Chat stream failed', error as Error, {
        provider: provider.name,
      });
      throw error;
    }
  }

  // ─── Provider Management ─────────────────────────────────────────────────

  async listProviders(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    model: string | null;
    endpoint: string | null;
    isDefault: boolean;
    health: ProviderHealth | null;
  }>> {
    const providers = await db.aiProvider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return providers.map((p) => {
      const cached = this.cache.get(p.id);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        model: p.model,
        endpoint: p.endpoint,
        isDefault: p.isDefault,
        health: cached ? cached.provider.getHealth() : null,
      };
    });
  }

  async createProvider(config: ProviderConfig): Promise<ILLMProvider> {
    const providerConfig = JSON.stringify(config);
    const provider = await db.aiProvider.create({
      data: {
        name: config.name,
        type: config.type,
        endpoint: config.endpoint || null,
        model: config.model || null,
        apiKeyEnvVar: config.apiKeyEnvVar || null,
        config: providerConfig,
        status: 'inactive',
      },
    });

    logger.info('Provider created', { id: provider.id, name: provider.name, type: provider.type });
    return this.buildProviderInstance(provider);
  }

  private async getActiveProviderWithModel(providerId?: string, modelOverride?: string): Promise<ILLMProvider> {
    if (!modelOverride) {
      return this.getActiveProvider(providerId);
    }

    // When a model override is requested we still respect provider selection,
    // but we create/cache a distinct provider instance keyed by (type+endpoint+model)
    // so model switching doesn't corrupt existing cached instances.
    const dbProvider = providerId
      ? await db.aiProvider.findUnique({ where: { id: providerId } })
      : await db.aiProvider.findFirst({ where: { isDefault: true, status: 'active' } });

    if (!dbProvider) {
      // Fall back to env provider behavior from getActiveProvider
      return this.getActiveProvider(providerId);
    }

    return this.buildProviderInstance({
      id: dbProvider.id,
      name: dbProvider.name,
      type: dbProvider.type,
      endpoint: dbProvider.endpoint,
      model: modelOverride,
      apiKeyEnvVar: dbProvider.apiKeyEnvVar,
      config: dbProvider.config,
    });
  }

  async listRuntimeModels(providerId: string): Promise<{ providerId: string; providerType: string; endpoint: string | null; models: string[]; supported: boolean }> {
    const provider = await db.aiProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new Error('Provider not found');
    }

    const endpoint = provider.endpoint;
    const type = provider.type;

    // Some providers can't enumerate models reliably; we still return current model.
    if (!endpoint) {
      return { providerId, providerType: type, endpoint: null, models: provider.model ? [provider.model] : [], supported: false };
    }

    if (type === 'ollama') {
      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/api/tags`);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to list Ollama models: ${res.status} ${t}`);
      }
      const data = await res.json() as { models?: Array<{ name?: string }> };
      const models = (data.models || []).map((m) => m.name).filter((m): m is string => !!m);
      return { providerId, providerType: type, endpoint, models, supported: true };
    }

    if (type === 'openai') {
      const apiKeyEnvVar = provider.apiKeyEnvVar || 'OPENAI_API_KEY';
      const apiKey = process.env[apiKeyEnvVar];
      if (!apiKey) {
        throw new Error(`Missing API key env var: ${apiKeyEnvVar}`);
      }
      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to list OpenAI models: ${res.status} ${t}`);
      }
      const data = await res.json() as { data?: Array<{ id?: string }> };
      const models = (data.data || []).map((m) => m.id).filter((m): m is string => !!m);
      return { providerId, providerType: type, endpoint, models, supported: true };
    }

    if (type === 'gemini') {
      const apiKeyEnvVar = provider.apiKeyEnvVar || 'GEMINI_API_KEY';
      const apiKey = process.env[apiKeyEnvVar];
      if (!apiKey) {
        throw new Error(`Missing API key env var: ${apiKeyEnvVar}`);
      }
      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/models?key=${apiKey}`);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to list Gemini models: ${res.status} ${t}`);
      }
      const data = await res.json() as { models?: Array<{ name?: string }> };
      const models = (data.models || [])
        .map((m) => m.name)
        .filter((m): m is string => !!m)
        .map((name) => (name.startsWith('models/') ? name.slice('models/'.length) : name));
      return { providerId, providerType: type, endpoint, models, supported: true };
    }

    // llamacpp and unknown providers: no standard listing
    return { providerId, providerType: type, endpoint, models: provider.model ? [provider.model] : [], supported: false };
  }

  async getProviderUsage(providerId: string): Promise<{ providerId: string; sessions: number; messages: number; lastUsedAt: string | null }> {
    const sessions = await db.chatSession.count({ where: { providerId } });
    const messages = await db.chatMessage.count({ where: { session: { providerId } } });
    const lastMsg = await db.chatMessage.findFirst({
      where: { session: { providerId } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return { providerId, sessions, messages, lastUsedAt: lastMsg ? lastMsg.createdAt.toISOString() : null };
  }

  async testProvider(providerId: string): Promise<ProviderHealth> {
    const provider = await this.getProviderById(providerId);
    const health = await provider.testConnection();

    // Update database
    await db.aiProvider.update({
      where: { id: providerId },
      data: {
        status: health.status,
        latencyMs: health.latencyMs,
        lastHealthCheck: new Date(),
        errorCount: health.status === 'error' ? (await db.aiProvider.findUnique({ where: { id: providerId } }))!.errorCount + 1 : 0,
        lastError: health.lastError,
      },
    });

    return health;
  }

  async deleteProvider(providerId: string): Promise<boolean> {
    try {
      // Remove from cache
      const cached = this.cache.get(providerId);
      if (cached) {
        cached.provider.dispose();
        this.cache.delete(providerId);
      }

      await db.aiProvider.delete({ where: { id: providerId } });
      logger.info('Provider deleted', { providerId });
      return true;
    } catch {
      return false;
    }
  }

  async setActiveProvider(providerId: string): Promise<void> {
    // First, unset all defaults
    await db.aiProvider.updateMany({ where: { isDefault: true }, data: { isDefault: false } });

    // Set the new default
    await db.aiProvider.update({
      where: { id: providerId },
      data: { isDefault: true },
    });

    // Invalidate settings cache
    this.settingsCache = null;

    logger.info('Active provider changed', { providerId });
  }

  // ─── Internal Methods ────────────────────────────────────────────────────

  private async getActiveProviderFromDB(): Promise<ILLMProvider | null> {
    // Check cache
    if (this.settingsCache && Date.now() - this.settingsCache.createdAt < this.settingsCacheTtl) {
      if (this.settingsCache.settings.activeProviderId) {
        return this.getProviderById(this.settingsCache.settings.activeProviderId);
      }
      return null;
    }

    // Query database
    const activeProvider = await db.aiProvider.findFirst({
      where: { isDefault: true, status: 'active' },
    });

    // Update cache
    this.settingsCache = {
      settings: {
        activeProviderId: activeProvider?.id || null,
        activeProviderType: activeProvider?.type || null,
      },
      createdAt: Date.now(),
    };

    if (activeProvider) {
      return this.buildProviderInstance(activeProvider);
    }

    return null;
  }

  private async getProviderById(providerId: string): Promise<ILLMProvider> {
    // Load from database
    const provider = await db.aiProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // Check cache (keyed by providerId:model)
    const cacheKey = `${providerId}:${provider.model || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < this.providerCacheTtl) {
      return cached.provider;
    }

    return this.buildProviderInstance(provider);
  }

  private buildProviderInstance(dbProvider: {
    id: string;
    name: string;
    type: string;
    endpoint: string | null;
    model: string | null;
    apiKeyEnvVar: string | null;
    config: string;
  }): ILLMProvider {
    const config = JSON.parse(dbProvider.config) as Record<string, unknown>;
    const cacheKey = `${dbProvider.id}:${dbProvider.model || ''}`;
    const providerConfig: ProviderConfig = {
      name: dbProvider.name,
      type: dbProvider.type as ProviderConfig['type'],
      endpoint: dbProvider.endpoint || undefined,
      model: dbProvider.model || undefined,
      apiKeyEnvVar: dbProvider.apiKeyEnvVar || undefined,
      temperature: config.temperature as number | undefined,
      maxTokens: config.maxTokens as number | undefined,
      maxConnections: config.maxConnections as number | undefined,
      timeoutMs: config.timeoutMs as number | undefined,
    };

    const instance = ProviderFactory.create(dbProvider.type as 'ollama' | 'openai' | 'gemini' | 'llamacpp', providerConfig);

    // Cache it
    this.cache.set(cacheKey, {
      provider: instance,
      createdAt: Date.now(),
    });

    return instance;
  }

  private getProviderFromEnv(): ILLMProvider | null {
    // Check for Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    if (ollamaUrl) {
      logger.debug('Using Ollama from environment', { endpoint: ollamaUrl });
      return ProviderFactory.create('ollama', {
        name: 'Ollama (env)',
        type: 'ollama',
        endpoint: ollamaUrl,
        model: process.env.OLLAMA_DEFAULT_MODEL || 'gemma4:e2b',
      });
    }

    return null;
  }

  /** Dispose all cached providers */
  dispose(): void {
    for (const cached of this.cache.values()) {
      cached.provider.dispose();
    }
    this.cache.clear();
    this.settingsCache = null;
    logger.info('Provider gateway disposed');
  }
}

// Singleton
export const providerGateway = new ProviderGateway();
