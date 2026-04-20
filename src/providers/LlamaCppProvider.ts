// ─── llama.cpp Provider ───────────────────────────────────────────────────────
// Real llama.cpp server provider. Uses native fetch(), no external HTTP libs.
// Endpoints used:
//   POST /completion       → completion & streaming (NDJSON / SSE)
//   GET  /health           → connection test
// No mocks. All requests are real HTTP calls to a llama.cpp server instance.

import { createLogger } from '@/lib/logger';
import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';
import type { ILLMProvider, ProviderResponse } from './IProvider';
import { ProviderError } from './IProvider';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:15000';
const DEFAULT_MODEL = 'default';
const DEFAULT_TIMEOUT_MS = 120_000;

const log = createLogger('provider:llamacpp');

// ── llama.cpp API shapes ──────────────────────────────────────────────────────

interface LlamaCppCompletionRequest {
  prompt: string;
  stream?: boolean;
  n_predict?: number;
  temperature?: number;
  stop?: string[];
  // Slot configuration
  n_keep?: number;
  seed?: number;
}

interface LlamaCppCompletionResponse {
  content: string;
  stop: boolean;
  model: string;
  prompt_id: number;
  stopped_eos: boolean;
  stopped_limit: boolean;
  stopped_word: boolean;
  stopping_word: string;
  tokens_cached: number;
  tokens_evaluated: number;
  tokens_predicted: number;
  timed_ms: number;
}

interface LlamaCppHealthResponse {
  status: string;
  // llama.cpp /health may return various shapes; we handle flexibly
  [key: string]: unknown;
}

// ── Provider Implementation ───────────────────────────────────────────────────

export class LlamaCppProvider implements ILLMProvider {
  readonly type = 'llamacpp';
  readonly name: string;

  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private health: ProviderHealth;
  private activeControllers: Set<AbortController>;

  constructor(config: ProviderConfig) {
    this.name = config.name ?? 'llama.cpp';
    this.endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, '');
    this.model = config.model ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    this.health = {
      status: 'inactive',
      latencyMs: null,
      lastCheck: null,
      errorCount: 0,
      lastError: null,
    };

    this.activeControllers = new Set();

    log.info('LlamaCppProvider initialized', {
      endpoint: this.endpoint,
      model: this.model,
      timeoutMs: this.timeoutMs,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
   * Convert ChatMessage[] to a single prompt string.
   * llama.cpp /completion endpoint accepts a free-form prompt.
   * We use a simple ChatML-like template for multi-turn conversations.
   */
  private buildPrompt(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): string {
    const parts: string[] = [];

    if (systemPrompt) {
      parts.push(`<|system|>\n${systemPrompt}</s>`);
    }

    for (const msg of messages) {
      // Skip system messages handled above
      if (msg.role === 'system' && systemPrompt) continue;

      switch (msg.role) {
        case 'system':
          parts.push(`<|system|>\n${msg.content}</s>`);
          break;
        case 'user':
          parts.push(`<|user|>\n${msg.content}</s>`);
          break;
        case 'assistant':
          parts.push(`<|assistant|">\n${msg.content}</s>`);
          break;
        case 'tool':
          parts.push(`<|tool|>\n${msg.content}</s>`);
          break;
      }
    }

    // End with assistant prefix so the model starts generating
    parts.push('<|assistant|">\n');

    const prompt = parts.join('\n');

    if (prompt.trim().length === 0) {
      throw new ProviderError('Cannot send empty prompt to llama.cpp', this.type);
    }

    return prompt;
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

  // ── ILLMProvider implementation ───────────────────────────────────────────

  async chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string },
  ): Promise<ProviderResponse> {
    const start = Date.now();
    const url = `${this.endpoint}/completion`;

    const body: LlamaCppCompletionRequest = {
      prompt: this.buildPrompt(messages, options?.systemPrompt),
      stream: false,
      n_predict: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stop: ['</s>', '<|user|>'],
    };

    log.debug('Sending chat request', { url, model: this.model, messageCount: messages.length });

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `llama.cpp chat request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      const data: LlamaCppCompletionResponse = await response.json();
      const latencyMs = Date.now() - start;

      if (!data.content && data.content !== '') {
        const msg = 'llama.cpp returned an empty response';
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      this.updateHealthOk(latencyMs);

      // Determine finish reason from llama.cpp flags
      let finishReason = 'stop';
      if (data.stopped_limit) finishReason = 'length';
      else if (data.stopped_word) finishReason = 'stop';
      else if (!data.stopped_eos) finishReason = 'length';

      log.info('Chat response received', {
        model: data.model ?? this.model,
        latencyMs,
        finishReason,
        tokensPredicted: data.tokens_predicted,
        timedMs: data.timed_ms,
      });

      return {
        content: data.content,
        model: data.model ?? this.model,
        provider: this.type,
        tokenCount:
          (data.tokens_evaluated ?? 0) + (data.tokens_predicted ?? 0),
        latencyMs,
        finishReason,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('abort') || message.includes('timeout');
      const providerMessage = isTimeout
        ? `llama.cpp request timed out after ${this.timeoutMs}ms`
        : `llama.cpp chat request failed: ${message}`;

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
    const url = `${this.endpoint}/completion`;

    const body: LlamaCppCompletionRequest = {
      prompt: this.buildPrompt(messages, options.systemPrompt),
      stream: true,
      n_predict: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      stop: ['</s>', '<|user|>'],
    };

    log.debug('Sending streaming chat request', { url, model: this.model });

    const requestId = `llamacpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let finishReason = 'stop';

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `llama.cpp stream request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      if (!response.body) {
        const msg = 'llama.cpp response body is null — streaming not supported';
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

        // llama.cpp streams newline-delimited JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data: LlamaCppCompletionResponse = JSON.parse(trimmed);

            if (data.content) {
              onChunk({
                id: requestId,
                type: 'chunk',
                content: data.content,
              });
            }

            // Track stop reasons from the last chunk
            if (data.stopped_eos) finishReason = 'stop';
            if (data.stopped_word) finishReason = 'stop';
            if (data.stopped_limit) finishReason = 'length';
          } catch {
            log.warn('Failed to parse llama.cpp streaming line', { line: trimmed });
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data: LlamaCppCompletionResponse = JSON.parse(buffer.trim());
          if (data.content) {
            onChunk({ id: requestId, type: 'chunk', content: data.content });
          }
        } catch {
          // Ignore final incomplete parse
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
        error: `llama.cpp stream error: ${message}`,
      };

      onChunk(errorChunk);
      throw new ProviderError(`llama.cpp stream error: ${message}`, this.type, undefined, err);
    }
  }

  async testConnection(): Promise<ProviderHealth> {
    const start = Date.now();
    const url = `${this.endpoint}/health`;

    log.debug('Testing llama.cpp connection', { url });

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        timeoutMs: 10_000,
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        // llama.cpp might not have a /health endpoint on all versions.
        // If 404, try /props or just consider the endpoint reachable
        // since we got an HTTP response.
        if (response.status === 404) {
          log.warn('llama.cpp /health returned 404 — server is reachable but endpoint may not exist');
          this.updateHealthOk(latencyMs);
          return { ...this.health };
        }

        const msg = `llama.cpp health check failed: ${response.status} ${response.statusText}`;
        this.updateHealthError(msg);
        return { ...this.health };
      }

      // Try to parse the health response body (shape varies by version)
      let healthData: LlamaCppHealthResponse | null = null;
      try {
        healthData = await response.json();
      } catch {
        // Response may not be JSON; we still know the server is reachable
      }

      log.info('llama.cpp connection test passed', {
        latencyMs,
        healthStatus: healthData?.status ?? 'unknown',
      });

      this.updateHealthOk(latencyMs);
      return { ...this.health };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const msg = `llama.cpp connection test failed: ${message}`;
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
    log.info('LlamaCppProvider disposed');
  }
}
