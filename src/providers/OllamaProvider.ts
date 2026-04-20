// ─── Ollama Provider ─────────────────────────────────────────────────────────
// Real Ollama REST API provider. Connects to local or remote Ollama instance.
// Endpoints used:
//   POST /api/chat          → completion & streaming
//   GET  /api/tags          → connection test
// No mocks. All requests go through native fetch().

import { createLogger } from '@/lib/logger';
import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';
import type { ILLMProvider, ProviderResponse } from './IProvider';
import { ProviderError } from './IProvider';

const DEFAULT_ENDPOINT = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';
const DEFAULT_TIMEOUT_MS = 120_000;

const log = createLogger('provider:ollama');

// ── Ollama API response shapes ────────────────────────────────────────────────

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
  load_duration?: number;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
  }>;
}

// ── Provider Implementation ───────────────────────────────────────────────────

export class OllamaProvider implements ILLMProvider {
  readonly type = 'ollama';
  readonly name: string;

  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private health: ProviderHealth;
  private activeControllers: Set<AbortController>;

  constructor(config: ProviderConfig) {
    this.name = config.name ?? 'Ollama';
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

    log.info('OllamaProvider initialized', {
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

  private buildMessages(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): OllamaMessage[] {
    const ollamaMessages: OllamaMessage[] = [];

    if (systemPrompt) {
      ollamaMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      // Skip system messages if we already injected one
      if (msg.role === 'system' && systemPrompt) continue;
      ollamaMessages.push({ role: msg.role, content: msg.content });
    }

    return ollamaMessages;
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
    const url = `${this.endpoint}/api/chat`;

    const body: OllamaChatRequest = {
      model: this.model,
      messages: this.buildMessages(messages, options?.systemPrompt),
      stream: false,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
      },
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
        const msg = `Ollama chat request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      const data: OllamaChatResponse = await response.json();
      const latencyMs = Date.now() - start;

      if (!data.message?.content) {
        const msg = 'Ollama returned an empty response';
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type);
      }

      this.updateHealthOk(latencyMs);

      log.info('Chat response received', {
        model: data.model,
        latencyMs,
        evalCount: data.eval_count,
      });

      return {
        content: data.message.content,
        model: data.model ?? this.model,
        provider: this.type,
        tokenCount: (data.eval_count ?? 0) + (data.prompt_eval_count ?? 0),
        latencyMs,
        finishReason: data.done ? 'stop' : 'length',
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('abort') || message.includes('timeout');
      const providerMessage = isTimeout
        ? `Ollama request timed out after ${this.timeoutMs}ms`
        : `Ollama chat request failed: ${message}`;

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
    const url = `${this.endpoint}/api/chat`;

    const body: OllamaChatRequest = {
      model: this.model,
      messages: this.buildMessages(messages, options.systemPrompt),
      stream: true,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
      },
    };

    log.debug('Sending streaming chat request', { url, model: this.model });

    const requestId = `ollama-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let fullContent = '';

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '<unreadable>');
        const msg = `Ollama stream request failed: ${response.status} ${response.statusText} — ${errorBody}`;
        this.updateHealthError(msg);
        throw new ProviderError(msg, this.type, response.status);
      }

      if (!response.body) {
        const msg = 'Ollama response body is null — streaming not supported';
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

        // Ollama streaming returns newline-delimited JSON objects
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data: OllamaChatResponse = JSON.parse(trimmed);
            const token = data.message?.content ?? '';
            fullContent += token;

            onChunk({
              id: requestId,
              type: 'chunk',
              content: token,
            });
          } catch {
            // Skip malformed JSON lines
            log.warn('Failed to parse Ollama streaming line', { line: trimmed });
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data: OllamaChatResponse = JSON.parse(buffer.trim());
          const token = data.message?.content ?? '';
          fullContent += token;
          if (token) {
            onChunk({ id: requestId, type: 'chunk', content: token });
          }
        } catch {
          // Ignore final incomplete parse
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
        error: `Ollama stream error: ${message}`,
      };

      onChunk(errorChunk);
      throw new ProviderError(`Ollama stream error: ${message}`, this.type, undefined, err);
    }
  }

  async testConnection(): Promise<ProviderHealth> {
    const start = Date.now();
    const url = `${this.endpoint}/api/tags`;

    log.debug('Testing Ollama connection', { url });

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        timeoutMs: 10_000, // Shorter timeout for health checks
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const msg = `Ollama health check failed: ${response.status} ${response.statusText}`;
        this.updateHealthError(msg);
        return { ...this.health };
      }

      const data: OllamaTagsResponse = await response.json();
      const modelNames = data.models?.map((m) => m.name) ?? [];

      log.info('Ollama connection test passed', { latencyMs, availableModels: modelNames });

      this.updateHealthOk(latencyMs);
      return { ...this.health };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const msg = `Ollama connection test failed: ${message}`;
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
    log.info('OllamaProvider disposed');
  }
}
