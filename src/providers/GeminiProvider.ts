// ─── Google Gemini Provider ───────────────────────────────────────────────────
// Real Google Gemini REST API provider. Uses native fetch(), no external libs.
// Endpoints used:
//   POST /models/{model}:generateContent         → completion
//   POST /models/{model}:streamGenerateContent   → streaming (SSE)
//   GET  /models                                  → connection test
// No mocks. All requests are real HTTP calls to the Gemini API.

import { createLogger } from '@/lib/logger';
import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';
import type { ILLMProvider, ProviderResponse } from './IProvider';
import { ProviderError } from './IProvider';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 120_000;

const log = createLogger('provider:gemini');

// ── Gemini API shapes ─────────────────────────────────────────────────────────

interface GeminiContent {
  parts: Array<{ text: string }>;
  role: 'user' | 'model';
}

interface GeminiGenerateRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
  systemInstruction?: { parts: Array<{ text: string }> };
}

interface GeminiPart {
  text?: string;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason: string;
    finishMessage?: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion: string;
}

interface GeminiModelsResponse {
  models: Array<{
    name: string;
    displayName: string;
    description: string;
    supportedGenerationMethods: string[];
  }>;
}

// ── Provider Implementation ───────────────────────────────────────────────────

export class GeminiProvider implements ILLMProvider {
  readonly type = 'gemini';
  readonly name: string;

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly apiKeyEnvVar: string;
  private health: ProviderHealth;
  private activeControllers: Set<AbortController>;

  constructor(config: ProviderConfig) {
    this.name = config.name ?? 'Gemini';
    this.baseUrl = (config.endpoint ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const configuredModel = config.model ?? DEFAULT_MODEL;
    this.model = configuredModel.startsWith('models/')
      ? configuredModel.slice('models/'.length)
      : configuredModel;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.apiKeyEnvVar = config.apiKeyEnvVar ?? 'GEMINI_API_KEY';

    this.health = {
      status: 'inactive',
      latencyMs: null,
      lastCheck: null,
      errorCount: 0,
      lastError: null,
    };

    this.activeControllers = new Set();

    this.validateApiKey();

    log.info('GeminiProvider initialized', {
      baseUrl: this.baseUrl,
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

  /**
   * Convert ChatMessage[] to Gemini's `contents[]` format.
   *
   * Gemini uses roles `user` and `model`. Consecutive messages with the same
   * role are merged (Gemini requires alternating user/model turns).
   */
  private buildContents(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): GeminiContent[] {
    const contents: GeminiContent[] = [];

    // Add a user message with the system prompt first if provided
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    }

    for (const msg of messages) {
      // Skip system messages — they're handled via systemInstruction or
      // prepended as a user message above
      if (msg.role === 'system') continue;

      const geminiRole = msg.role === 'assistant' ? 'model' : 'user';

      // Merge with the previous entry if the role matches (Gemini requires alternating)
      if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
        contents[contents.length - 1].parts.push({ text: msg.content });
      } else {
        contents.push({
          role: geminiRole,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Ensure the conversation doesn't start with model
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.unshift({ role: 'user', parts: [{ text: '.' }] });
    }

    if (contents.length === 0) {
      throw new ProviderError('Cannot send empty message list to Gemini', this.type);
    }

    return contents;
  }

  private extractTextFromParts(parts: GeminiPart[]): string {
    return parts
      .map((p) => p.text ?? '')
      .join('');
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
   * Parse a single SSE line from Gemini's stream. Returns the JSON string,
   * null for comments/blanks, or undefined for stream end.
   */
  private parseSSELine(line: string): string | null | undefined {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return null;
    if (!trimmed.startsWith('data:')) return null;

    const payload = trimmed.slice(5).trim();
    if (!payload) return null;

    return payload;
  }

  // ── ILLMProvider implementation ───────────────────────────────────────────

  async chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string },
  ): Promise<ProviderResponse> {
    const start = Date.now();
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${apiKey}`;

    const contents = this.buildContents(messages, options?.systemPrompt);

    const body: GeminiGenerateRequest = {
      contents,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      },
    };

    // If a system prompt is provided, also pass it as systemInstruction
    // (Gemini's native way for system prompts in newer API versions)
    if (options?.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    log.debug('Sending chat request', { model: this.model, messageCount: messages.length });

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `Gemini chat request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      const data: GeminiGenerateResponse = await response.json();
      const latencyMs = Date.now() - start;

      // Check for safety blocks or empty responses
      if (!data.candidates || data.candidates.length === 0) {
        const msg = 'Gemini returned no candidates (possibly blocked by safety filters)';
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      const candidate = data.candidates[0];
      const content = this.extractTextFromParts(candidate.content?.parts ?? []);

      if (!content) {
        const msg = `Gemini returned empty content (finishReason: ${candidate.finishReason ?? 'unknown'})`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      this.updateHealthOk(latencyMs);

      log.info('Chat response received', {
        model: this.model,
        latencyMs,
        finishReason: candidate.finishReason,
        usage: data.usageMetadata,
      });

      return {
        content,
        model: this.model,
        provider: this.type,
        tokenCount: data.usageMetadata?.totalTokenCount,
        latencyMs,
        finishReason: candidate.finishReason ?? 'stop',
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('abort') || message.includes('timeout');
      const providerMessage = isTimeout
        ? `Gemini request timed out after ${this.timeoutMs}ms`
        : `Gemini chat request failed: ${message}`;

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
    const { onChunk } = options;
    const apiKey = this.getApiKey();

    // Use streamGenerateContent with alt=sse for SSE transport
    const url = `${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = this.buildContents(messages, options.systemPrompt);

    const body: GeminiGenerateRequest = {
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    log.debug('Sending streaming chat request', { model: this.model });

    const requestId = `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let finishReason = 'stop';

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `Gemini stream request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      if (!response.body) {
        const msg = 'Gemini response body is null — streaming not supported';
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
          if (parsed === null || parsed === undefined) continue;

          try {
            const data: GeminiGenerateResponse = JSON.parse(parsed);

            if (data.candidates?.[0]) {
              const candidate = data.candidates[0];
              const text = this.extractTextFromParts(candidate.content?.parts ?? []);

              if (text) {
                onChunk({
                  id: requestId,
                  type: 'chunk',
                  content: text,
                });
              }

              if (candidate.finishReason) {
                finishReason = candidate.finishReason;
              }
            }
          } catch {
            log.warn('Failed to parse Gemini SSE data line');
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const parsed = this.parseSSELine(buffer);
        if (parsed !== null && parsed !== undefined) {
          try {
            const data: GeminiGenerateResponse = JSON.parse(parsed);
            if (data.candidates?.[0]) {
              const text = this.extractTextFromParts(data.candidates[0].content?.parts ?? []);
              if (text) {
                onChunk({ id: requestId, type: 'chunk', content: text });
              }
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
        finishReason,
      };

      onChunk(finalChunk);
      return finalChunk;
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);

      const errorChunk: StreamChunk = {
        id: requestId,
        type: 'error',
        error: `Gemini stream error: ${message}`,
      };

      onChunk(errorChunk);
      throw new ProviderError(`Gemini stream error: ${message}`, this.type, undefined, err);
    }
  }

  async testConnection(): Promise<ProviderHealth> {
    const start = Date.now();

    log.debug('Testing Gemini connection');

    try {
      const apiKey = this.getApiKey();
      const url = `${this.baseUrl}/models?key=${apiKey}`;

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        timeoutMs: 10_000,
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const msg = `Gemini health check failed: ${response.status} ${response.statusText}`;
        this.updateHealthError(msg);
        return { ...this.health };
      }

      const data: GeminiModelsResponse = await response.json();
      const modelNames = data.models?.map((m) => m.displayName) ?? [];

      log.info('Gemini connection test passed', { latencyMs, modelCount: modelNames.length });

      this.updateHealthOk(latencyMs);
      return { ...this.health };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const msg = `Gemini connection test failed: ${message}`;
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
    log.info('GeminiProvider disposed');
  }
}
