// ─── Provider Factory ─────────────────────────────────────────────────────────
// Factory pattern for creating and caching ILLMProvider instances.
// All providers returned are real implementations — no mocks, no simulations.

import { createLogger } from '@/lib/logger';
import type { ProviderType, ProviderConfig } from '@/types';
import type { ILLMProvider } from './IProvider';
import { ProviderError } from './IProvider';
import { OllamaProvider } from './OllamaProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { LlamaCppProvider } from './LlamaCppProvider';

const log = createLogger('provider:factory');

// ── Cache key generation ──────────────────────────────────────────────────────

/**
 * Generate a unique cache key from provider type + endpoint.
 * Two providers of the same type pointing at different endpoints get
 * separate instances.
 */
function cacheKey(type: ProviderType, config: ProviderConfig): string {
  const endpoint = config.endpoint ?? '';
  const model = config.model ?? '';
  return `${type}:${endpoint}:${model}`;
}

// ── Provider registry (maps type → constructor) ───────────────────────────────

type ProviderConstructor = new (config: ProviderConfig) => ILLMProvider;

const PROVIDER_REGISTRY: Record<ProviderType, ProviderConstructor> = {
  ollama: OllamaProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  llamacpp: LlamaCppProvider,
};

const VALID_TYPES = new Set<string>(Object.keys(PROVIDER_REGISTRY));

// ── Factory ───────────────────────────────────────────────────────────────────

class ProviderFactoryImpl {
  private cache: Map<string, ILLMProvider>;
  private disposed: boolean;

  constructor() {
    this.cache = new Map();
    this.disposed = false;
    log.info('ProviderFactory initialized');
  }

  /**
   * Create or retrieve a cached provider instance.
   *
   * @param type  - The provider type ('ollama' | 'openai' | 'gemini' | 'llamacpp')
   * @param config - Provider configuration
   * @returns An ILLMProvider instance ready for use
   * @throws {ProviderError} if the type is unknown or the factory is disposed
   */
  create(type: ProviderType, config: ProviderConfig): ILLMProvider {
    if (this.disposed) {
      throw new ProviderError(
        'ProviderFactory has been disposed — cannot create new providers',
        'factory',
      );
    }

    if (!VALID_TYPES.has(type)) {
      throw new ProviderError(
        `Unknown provider type: "${type}". Supported types: ${[...VALID_TYPES].join(', ')}`,
        'factory',
      );
    }

    const key = cacheKey(type, config);
    const cached = this.cache.get(key);

    if (cached) {
      log.debug('Returning cached provider', { type, key });
      return cached;
    }

    const Constructor = PROVIDER_REGISTRY[type];
    const provider = new Constructor(config);

    this.cache.set(key, provider);

    log.info('Created new provider instance', {
      type,
      name: provider.name,
      model: provider.getModel(),
      cacheSize: this.cache.size,
    });

    return provider;
  }

  /**
   * Retrieve a cached provider without creating a new one.
   *
   * @returns The cached provider, or undefined if not found
   */
  get(type: ProviderType, config: ProviderConfig): ILLMProvider | undefined {
    const key = cacheKey(type, config);
    return this.cache.get(key);
  }

  /**
   * Check if a provider of the given type + config is already cached.
   */
  has(type: ProviderType, config: ProviderConfig): boolean {
    return this.cache.has(cacheKey(type, config));
  }

  /**
   * Remove a specific provider from the cache and dispose it.
   *
   * @returns true if the provider was found and removed, false otherwise
   */
  remove(type: ProviderType, config: ProviderConfig): boolean {
    const key = cacheKey(type, config);
    const provider = this.cache.get(key);

    if (!provider) return false;

    provider.dispose();
    this.cache.delete(key);

    log.info('Removed and disposed provider', { type, key, remainingCacheSize: this.cache.size });
    return true;
  }

  /**
   * Dispose all cached providers and clear the cache.
   * After calling this, the factory cannot be reused.
   */
  disposeAll(): void {
    if (this.disposed) return;

    const count = this.cache.size;
    for (const [key, provider] of this.cache) {
      try {
        provider.dispose();
      } catch (err) {
        log.warn('Error disposing provider during disposeAll', { key, error: err });
      }
    }

    this.cache.clear();
    this.disposed = true;

    log.info('ProviderFactory disposed all providers', { count });
  }

  /**
   * Get the number of currently cached providers.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get a list of all cached provider types.
   */
  get types(): string[] {
    return [...this.cache.values()].map((p) => p.type);
  }

  /**
   * Run a health check on all cached providers.
   *
   * @returns Map of provider type → health status
   */
  async healthCheckAll(): Promise<Record<string, Awaited<ReturnType<ILLMProvider['testConnection']>>>> {
    const results: Record<string, Awaited<ReturnType<ILLMProvider['testConnection']>>> = {};

    const entries = [...this.cache.entries()];
    await Promise.allSettled(
      entries.map(async ([key, provider]) => {
        try {
          results[key] = await provider.testConnection();
        } catch (err) {
          log.warn('Health check failed for provider', { key, error: err });
          results[key] = provider.getHealth();
        }
      }),
    );

    return results;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

// Export a singleton instance so the entire application shares one factory + cache.
// In tests, import the class directly for isolated instances.
let singleton: ProviderFactoryImpl | null = null;

function getFactory(): ProviderFactoryImpl {
  if (!singleton) {
    singleton = new ProviderFactoryImpl();
  }
  return singleton;
}

// Public API surface
export const ProviderFactory = {
  create: (type: ProviderType, config: ProviderConfig) => getFactory().create(type, config),
  get: (type: ProviderType, config: ProviderConfig) => getFactory().get(type, config),
  has: (type: ProviderType, config: ProviderConfig) => getFactory().has(type, config),
  remove: (type: ProviderType, config: ProviderConfig) => getFactory().remove(type, config),
  disposeAll: () => getFactory().disposeAll(),
  get size() {
    return getFactory().size;
  },
  get types() {
    return getFactory().types;
  },
  healthCheckAll: () => getFactory().healthCheckAll(),
  /**
   * Reset the singleton (useful for testing or hot-reload scenarios).
   * Disposes all existing providers first.
   */
  reset: () => {
    if (singleton) {
      singleton.disposeAll();
    }
    singleton = null;
  },
};

export { ProviderFactoryImpl };
