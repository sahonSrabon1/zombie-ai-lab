// ─── System Identity ─────────────────────────────────────────────────────────
// ZombieCoder System Identity - Read-Only, anchored in every prompt

export interface SystemIdentity {
  id: string;
  name: string;
  version: string;
  tagline: string;
  owner: string;
  organization: string;
  address: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  license: string;
}

// ─── Provider Types ─────────────────────────────────────────────────────────

export type ProviderType = 'ollama' | 'openai' | 'gemini' | 'llamacpp';
export type ProviderStatus = 'active' | 'inactive' | 'error';

export interface ProviderConfig {
  name: string;
  type: ProviderType;
  endpoint?: string;
  model?: string;
  apiKeyEnvVar?: string;
  temperature?: number;
  maxTokens?: number;
  maxConnections?: number;
  timeoutMs?: number;
  [key: string]: unknown;
}

export interface ProviderHealth {
  status: ProviderStatus;
  latencyMs: number | null;
  lastCheck: string | null;
  errorCount: number;
  lastError: string | null;
}

// ─── Chat Types ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  model?: string;
  provider?: string;
  tokenCount?: number;
  latencyMs?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  agentId?: string;
  providerId?: string;
  sessionId?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  tokenCount?: number;
  latencyMs: number;
  finishReason: string;
  sessionId?: string;
}

export interface StreamChunk {
  id: string;
  type: 'chunk' | 'done' | 'error';
  content?: string;
  finishReason?: string;
  error?: string;
}

// ─── Agent Types ────────────────────────────────────────────────────────────

export type AgentType = 'chatbot' | 'assistant' | 'coder' | 'researcher' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'maintenance';

export interface AgentConfig {
  id?: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  personaName?: string;
  systemPrompt?: string;
  description?: string;
  config: {
    maxTokens?: number;
    temperature?: number;
    capabilities?: string[];
    languagePreferences?: {
      greetingPrefix?: string;
      primaryLanguage?: string;
      technicalLanguage?: string;
    };
    systemInstructions?: string;
    model?: string;
    metadata?: Record<string, unknown>;
  };
  providerId?: string;
}

// ─── Memory Types ───────────────────────────────────────────────────────────

export interface MemoryEntry {
  id?: string;
  content: string;
  topic?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  importance?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  topic?: string;
  agentId?: string;
}

// ─── MCP Types ──────────────────────────────────────────────────────────────

export interface ToolDefinition {
  id?: string;
  name: string;
  description: string;
  category?: string;
  inputSchema: Record<string, unknown>;
  requiredAuth?: boolean;
  enabled?: boolean;
}

export interface ToolExecutionRequest {
  agentId?: string;
  toolName: string;
  input: unknown;
  sessionId?: string;
  configOverride?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionMs: number;
  toolName: string;
}

// ─── Prompt Template Types ──────────────────────────────────────────────────

export interface PromptTemplateDefinition {
  id?: string;
  name: string;
  description?: string;
  template: string;
  inputVariables: string[];
  category?: 'identity' | 'code' | 'chat' | 'ethical' | 'custom';
  isSystem?: boolean;
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    stockServer: 'connected' | 'disconnected';
    providers: Record<string, ProviderStatus>;
  };
  timestamp: string;
}

// ─── Settings Types ─────────────────────────────────────────────────────────

export interface SystemSettingEntry {
  id?: string;
  key: string;
  value: string;
  description?: string;
  category?: 'general' | 'provider' | 'security' | 'performance';
  isSecret?: boolean;
}
