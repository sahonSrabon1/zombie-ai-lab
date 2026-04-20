// ─── ZombieCoder Provider Interface ─────────────────────────────────────────
// Core interface that all LLM providers must implement.
// No mocks. No simulations. Real HTTP requests only.

import type { ChatMessage, ProviderConfig, ProviderHealth, StreamChunk } from '@/types';

/**
 * Standard response from a non-streaming provider completion.
 */
export interface ProviderResponse {
  content: string;
  model: string;
  provider: string;
  tokenCount?: number;
  latencyMs: number;
  finishReason: string;
}

/**
 * Every LLM provider in ZombieCoder Agentic Hub must implement this interface.
 *
 * Contract:
 *  - `chat()`        → single completion, returns full response
 *  - `chatStream()`  → SSE / streaming completion, calls `onChunk` per token
 *  - `testConnection()` → lightweight probe, returns fresh health data
 *  - `getHealth()`   → returns last-cached health (no network call)
 *  - `getModel()`    → returns the configured model identifier
 *  - `dispose()`     → tear down any open handles / timers
 */
export interface ILLMProvider {
  /** Machine-readable provider type (e.g. 'ollama', 'openai') */
  readonly type: string;

  /** Human-readable provider name */
  readonly name: string;

  /**
   * Generate a completion from an array of chat messages.
   *
   * @throws {ProviderError} on network failure, auth error, timeout, etc.
   */
  chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
  ): Promise<ProviderResponse>;

  /**
   * Stream a completion from messages, invoking `onChunk` for every token
   * received from the upstream provider. The returned Promise resolves with
   * a final "done" chunk when the stream completes.
   *
   * @throws {ProviderError} on network failure, auth error, timeout, etc.
   */
  chatStream(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      onChunk: (chunk: StreamChunk) => void;
    },
  ): Promise<StreamChunk>;

  /**
   * Perform a lightweight connectivity test and return fresh health data.
   * This should make a real HTTP request to the provider endpoint.
   */
  testConnection(): Promise<ProviderHealth>;

  /**
   * Return the last-known health status **without** making a network call.
   */
  getHealth(): ProviderHealth;

  /** Return the model identifier this provider is configured to use. */
  getModel(): string;

  /**
   * Release any resources (AbortControllers, timers, sockets, etc.).
   * Called when a provider is removed from the factory cache.
   */
  dispose(): void;
}

/**
 * Typed error thrown by providers so callers can distinguish provider
 * failures from generic JS errors.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerType: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}
