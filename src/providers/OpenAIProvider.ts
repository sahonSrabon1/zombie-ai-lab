// ─── OpenAI Provider ──────────────────────────────────────────────────────────
// Real OpenAI API provider. Uses native fetch(), no external HTTP libraries.
// Endpoints used:
//   POST /chat/completions   → completion & streaming (SSE)
//   GET  /models             → connection test
// No mocks. All requests are real HTTP calls to OpenAI (or compatible).

import { createLogger } from '@/lib/logger';
import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';
import type { ILLMProvider, ProviderResponse } from './IProvider';
import { ProviderError } from './IProvider';

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TIMEOUT_MS = 120_000;

const log = createLogger('provider:openai');

// ── OpenAI API shapes ─────────────────────────────────────────────────────────

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  stream_options?: { include_usage: true };
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Shape of each SSE chunk in an OpenAI streaming response */
interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    owned_by: string;
  }>;
}

// ── Provider Implementation ───────────────────────────────────────────────────

export class OpenAIProvider implements ILLMProvider {
  readonly type = 'openai';
  readonly name: string;

  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly apiKeyEnvVar: string;
  private health: ProviderHealth;
  private activeControllers: Set<AbortController>;

  constructor(config: ProviderConfig) {
    this.name = config.name ?? 'OpenAI';
    this.endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, '');
    this.model = config.model ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.apiKeyEnvVar = config.apiKeyEnvVar ?? 'OPENAI_API_KEY';

    this.health = {
      status: 'inactive',
      latencyMs: null,
      lastCheck: null,
      errorCount: 0,
      lastError: null,
    };

    this.activeControllers = new Set();

    this.validateApiKey();

    log.info('OpenAIProvider initialized', {
      endpoint: this.endpoint,
      model: this.model,
      apiKeyEnvVar: this.apiKeyEnvVar,
      timeoutMs: this.timeoutMs,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getApiKey(): string {
    const key = process.env[this.apiKeyEnvVar];
    if (!key) {
      throw new ProviderError(
        `API key not found: environment variable "${this.apiKeyEnvVar}" is not set`,
        this.type,
      );
    }
    return key;
  }

  private validateApiKey(): void {
    const key = process.env[this.apiKeyEnvVar];
    if (!key) {
      log.warn(`API key environment variable "${this.apiKeyEnvVar}" is not set. Calls will fail.`);
    }
  }

  private createAbortController(): AbortController {
    const controller = new AbortController();
    this.activeControllers.add(controller);
    return controller;
  }

  private releaseController(controller: AbortController): void {
    this.activeControllers.delete(controller);
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit & { timeoutMs?: number },
  ): Promise<Response> {
    const { timeoutMs: timeout = this.timeoutMs, ...fetchInit } = init;
    const controller = this.createAbortController();

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
      this.releaseController(controller);
    }
  }

  private buildMessages(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): OpenAIMessage[] {
    const openaiMessages: OpenAIMessage[] = [];

    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      // Deduplicate system prompt
      if (msg.role === 'system' && systemPrompt) continue;
      openaiMessages.push({ role: msg.role, content: msg.content });
    }

    if (openaiMessages.length === 0) {
      throw new ProviderError('Cannot send empty message list to OpenAI', this.type);
    }

    return openaiMessages;
  }

  private updateHealthError(error: string): void {
    this.health.errorCount += 1;
    this.health.lastError = error;
    this.health.status = 'error';
    this.health.lastCheck = new Date().toISOString();
  }

  private updateHealthOk(latencyMs: number): void {
    this.health.status = 'active';
    this.health.latencyMs = latencyMs;
    this.health.lastCheck = new Date().toISOString();
    this.health.errorCount = 0;
    this.health.lastError = null;
  }

  /**
   * Parse a single SSE line. Returns the `data` payload string, or null for
   * comments / blank lines. Returns undefined when `[DONE]` is received.
   */
  private parseSSELine(line: string): string | null | undefined {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return null; // comment / blank
    if (!trimmed.startsWith('data:')) return null;

    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return undefined; // stream end sentinel

    return payload;
  }

  // ── ILLMProvider implementation ───────────────────────────────────────────

  async chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string },
  ): Promise<ProviderResponse> {
    const start = Date.now();
    const url = `${this.endpoint}/chat/completions`;

    const apiKey = this.getApiKey();

    const body: OpenAIChatRequest = {
      model: this.model,
      messages: this.buildMessages(messages, options?.systemPrompt),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: false,
    };

    log.debug('Sending chat request', { url, model: this.model, messageCount: messages.length });

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `OpenAI chat request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      const data: OpenAIChatResponse = await response.json();
      const latencyMs = Date.now() - start;

      const choice = data.choices?.[0];
      if (!choice?.message?.content) {
        const msg = 'OpenAI returned no content in response';
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      this.updateHealthOk(latencyMs);

      log.info('Chat response received', {
        model: data.model,
        latencyMs,
        finishReason: choice.finish_reason,
        usage: data.usage,
      });

      return {
        content: choice.message.content,
        model: data.model ?? this.model,
        provider: this.type,
        tokenCount: data.usage?.total_tokens,
        latencyMs,
        finishReason: choice.finish_reason ?? 'stop',
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('abort') || message.includes('timeout');
      const providerMessage = isTimeout
        ? `OpenAI request timed out after ${this.timeoutMs}ms`
        : `OpenAI chat request failed: ${message}`;

      this.updateHealthError(providerMessage);
      throw new ProviderError(providerMessage, this.type, undefined, err);
    }
  }

  async chatStream(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      onChunk: (chunk: StreamChunk) => void;
    },
  ): Promise<StreamChunk> {
    const { onChunk, ...chatOptions } = options;
    const url = `${this.endpoint}/chat/completions`;

    const apiKey = this.getApiKey();

    const body: OpenAIChatRequest = {
      model: this.model,
      messages: this.buildMessages(messages, options.systemPrompt),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    };

    log.debug('Sending streaming chat request', { url, model: this.model });

    const requestId = `openai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let fullContent = '';

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `OpenAI stream request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      if (!response.body) {
        const msg = 'OpenAI response body is null — streaming not supported';
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const parsed = this.parseSSELine(line);

          if (parsed === null) continue;  // blank / comment
          if (parsed === undefined) continue; // [DONE] — handle after loop

          try {
            const data = JSON.parse(parsed) as OpenAIStreamChunk;
            const delta = data.choices?.[0]?.delta?.content ?? '';

            if (delta) {
              fullContent += delta;
              onChunk({
                id: requestId,
                type: 'chunk',
                content: delta,
              });
            }
          } catch {
            log.warn('Failed to parse OpenAI SSE data line');
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const parsed = this.parseSSELine(buffer);
        if (parsed !== null && parsed !== undefined) {
          try {
            const data = JSON.parse(parsed) as OpenAIStreamChunk;
            const delta = data.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              fullContent += delta;
              onChunk({ id: requestId, type: 'chunk', content: delta });
            }
          } catch {
            // Ignore
          }
        }
      }

      this.updateHealthOk(Date.now());

      const finalChunk: StreamChunk = {
        id: requestId,
        type: 'done',
        finishReason: 'stop',
      };

      onChunk(finalChunk);
      return finalChunk;
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);

      const errorChunk: StreamChunk = {
        id: requestId,
        type: 'error',
        error: `OpenAI stream error: ${message}`,
      };

      onChunk(errorChunk);
      throw new ProviderError(`OpenAI stream error: ${message}`, this.type, undefined, err);
    }
  }

  async testConnection(): Promise<ProviderHealth> {
    const start = Date.now();
    const url = `${this.endpoint}/models`;

    log.debug('Testing OpenAI connection', { url });

    try {
      const apiKey = this.getApiKey();

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeoutMs: 10_000,
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const msg = `OpenAI health check failed: ${response.status} ${response.statusText}`;
        this.updateHealthError(msg);
        return { ...this.health };
      }

      const data: OpenAIModelsResponse = await response.json();
      const modelIds = data.data?.map((m) => m.id) ?? [];

      log.info('OpenAI connection test passed', { latencyMs, modelCount: modelIds.length });

      this.updateHealthOk(latencyMs);
      return { ...this.health };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const msg = `OpenAI connection test failed: ${message}`;
      this.updateHealthError(msg);
      return { ...this.health };
    }
  }

  getHealth(): ProviderHealth {
    return { ...this.health };
  }

  getModel(): string {
    return this.model;
  }

  dispose(): void {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
    log.info('OpenAIProvider disposed');
  }
}
