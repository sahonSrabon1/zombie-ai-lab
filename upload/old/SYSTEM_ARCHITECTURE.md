# ZombieCoder Agentic Hub - Complete System Architecture & Integration Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Flow](#architecture-flow)
3. [Core Components](#core-components)
4. [Provider Integration System](#provider-integration-system)
5. [Prompt Template Engine](#prompt-template-engine)
6. [Stock Server - Real-time Streaming](#stock-server---real-time-streaming)
7. [Agent System & Personas](#agent-system--personas)
8. [MCP Integration](#mcp-integration)
9. [Database & Environment Configuration](#database--environment-configuration)
10. [Memory & Session Management](#memory--session-management)
11. [File Structure](#file-structure)
12. [Deployment Guide](#deployment-guide)

---

## 🎯 System Overview

**ZombieCoder Agentic Hub** is a locally-operating, ethically-driven AI development assistant platform that prioritizes user safety, transparency, and genuine assistance. The system orchestrates multiple AI agents through a centralized architecture with real-time streaming capabilities, MCP (Model Context Protocol) integration, and flexible provider management.

### Key Features
- **Local-First Operation**: All processing occurs on user's machine with complete privacy control
- **Multi-Provider Support**: Ollama, OpenAI, Gemini, llama.cpp with automatic fallback
- **Real-time Streaming**: WebSocket and HTTP SSE streaming via Stock Server
- **Agent Orchestration**: Multiple specialized agents with unique personas
- **MCP Integration**: Tool calling and context-aware assistance
- **Ethical Framework**: Built-in safety guidelines and transparent limitation communication
- **Database Agnostic**: Works with or without database (MySQL + SQLite fallback)

---

## 🔄 Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ VS Code  │  │ Terminal │  │ Web UI   │  │ MCP Editors  │    │
│  │ Extension│  │ (CLI)    │  │ (React)  │  │ (Qoder, etc) │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
└───────┼─────────────┼─────────────┼────────────────┼────────────┘
        │             │             │                │
        ▼             ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express Server (Port 8000)                              │   │
│  │  - Middleware: Helmet, CORS, API Audit                   │   │
│  │  - Header: X-Powered-By: ZombieCoder-by-SahonSrabon      │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │            │            │            │                │
│    ┌────┴───┐  ┌────┴───┐  ┌────┴───┐  ┌────┴────┐            │
│    │ /chat  │  │ /agents│  │  /mcp  │  │ /memory │            │
│    │ /editor│  │/models │  │ /tools │  │ /vector │            │
│    └────┬───┘  └────┬───┘  └────┬───┘  └────┬────┘            │
└─────────┼────────────┼──────────┼────────────┼─────────────────┘
          │            │          │            │
          ▼            ▼          ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ProviderGateway│  │ MemoryService│  │  ToolRegistry (MCP) │   │
│  │ - DB or ENV  │  │ - SQLite     │  │ - Tool Execution    │   │
│  │ - Fallback   │  │ - Embeddings │  │ - Agent Tools       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROMPT ENGINE LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prompt Templates (/src/prompt/index.ts)                 │   │
│  │  - System Identity Injection                             │   │
│  │  - Agent Persona Configuration                           │   │
│  │  - Session Context & Metadata                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROVIDER ABSTRACTION LAYER                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ProviderFactory                                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐  │   │
│  │  │ Ollama │ │ OpenAI │ │ Gemini │ │ llama.cpp        │  │   │
│  │  │ Local  │ │ Cloud  │ │ Cloud  │ │ Local Fallback   │  │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STOCK SERVER (Port 9998)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Real-time Streaming Engine                               │   │
│  │  - WebSocket: Bidirectional communication                 │   │
│  │  - HTTP SSE: Server-Sent Events for web clients           │   │
│  │  - OpenAI-compatible API (/v1/chat/completions)           │   │
│  │  - Ollama-compatible API (/api/chat, /api/generate)       │   │
│  │  - Connection Pooling & Buffer Management                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. **Main Express Server** (`/src/index.ts`)
- **Port**: 8000 (configurable via `PORT` env)
- **Responsibilities**:
  - HTTP API routing
  - WebSocket setup for real-time updates
  - Service initialization (database, memory, RAG, providers)
  - Graceful shutdown handling
  - API audit middleware

### 2. **Stock Server** (`/src/stock/index.ts`)
- **Port**: 9998 (dedicated streaming server)
- **Responsibilities**:
  - Real-time streaming from providers to agents
  - WebSocket and HTTP SSE support
  - Connection pooling for providers
  - OpenAI and Ollama compatible endpoints
  - Buffer management for performance

### 3. **Provider Gateway** (`/src/services/providerGateway.ts`)
- **Smart Provider Selection**:
  - Database configuration (if available)
  - Environment variable fallback
  - Automatic fallback chain: DB → llama.cpp → Ollama
- **Caching**: Settings cached with configurable TTL
- **Latency Monitoring**: Debug mode for performance tracking

### 4. **Prompt Template Engine** (`/src/prompt/index.ts`)
- **Centralized Templates**: All system prompts defined here
- **Template Types**:
  - `ZOMBIECODER_IDENTITY`: Core system identity
  - `CODE_GENERATION_TEMPLATE`: Code generation tasks
  - `CHAT_CONVERSATION_TEMPLATE`: Conversational interactions
  - `ETHICAL_DECISION_TEMPLATE`: Safety guidelines
  - `buildAgentSystemPrompt()`: Dynamic agent persona builder

### 5. **Memory Service** (`/src/memory/memory.ts`)
- **Database**: SQLite (local-first, no external dependencies)
- **Memory Types**:
  - Agent Memories (per-agent persistent memory)
  - Individual Memories (user-specific memories)
  - Session Chat History (conversation context)
- **Features**:
  - Embedding-based similarity search
  - Memory importance scoring
  - Export/Import capabilities
  - Advanced filtering and pagination

---

## 🔌 Provider Integration System

### Provider Architecture

```typescript
// Provider Interface (/src/providers/IProvider.ts)
interface ILLMProvider {
  generate(prompt: string, options?: IGenerateOptions): Promise<string>;
  streamGenerate(prompt: string, options: IStreamOptions): Promise<string>;
  chat(messages: ChatMessage[], options?: IGenerateOptions): Promise<string>;
  createCompletion(messages: Array<{role: string, content: string}>, options?: IGenerateOptions): Promise<IProviderResponse>;
  testConnection(): Promise<boolean>;
  isHealthy(): boolean;
}
```

### Supported Providers

| Provider | Type | Streaming | System Prompt | Raw Stream | Use Case |
|----------|------|-----------|---------------|------------|----------|
| **Ollama** | Local | ✅ | ✅ | ✅ | Default local LLM |
| **llama.cpp** | Local | ✅ | ✅ | ✅ | Fallback local LLM |
| **OpenAI** | Cloud | ✅ | ✅ | ✅ | GPT models via API |
| **Gemini** | Cloud | ✅ | ✅ | ✅ | Google AI models |

### Provider Factory Pattern

```typescript
// ProviderFactory creates and caches provider instances
const provider = ProviderFactory.create('ollama', {
  endpoint: 'http://localhost:11434',
  model: 'gemma4:e2b',
  maxConnections: 10,
  temperature: 0.7,
  max_tokens: 2048
});
```

### Configuration Hierarchy

1. **Database Configuration** (if available):
   - `ai_providers` table stores provider settings
   - `system_settings` table stores active provider ID
   - Config JSON with API key references (env var names, not actual keys)

2. **Environment Variables** (fallback):
   ```bash
   # Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_DEFAULT_MODEL=gemma4:e2b
   
   # llama.cpp Fallback
   LLAMA_CPP_FALLBACK_ENABLED=true
   LLAMA_CPP_HOST=127.0.0.1
   LLAMA_CPP_PORT=15000
   
   # API Keys (referenced by name, stored securely)
   GOOGLE_GEMINI_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```

3. **System Defaults** (if no DB or ENV):
   - Default to Ollama at `http://localhost:11434`
   - Model: `gemma4:e2b`

---

## 📝 Prompt Template Engine

### System Identity Injection

Every prompt sent to providers includes the ZombieCoder identity:

```typescript
export const ZOMBIECODER_IDENTITY = `You are ZombieCoder: যেখানে কোড ও কথা বলে।

[SYSTEM_IDENTITY]
- Name: ZombieCoder
- Organization: Developer Zone
- Location: Dhaka, Bangladesh
- Owner: Sahon Srabon
- Tagline: "যেখানে কোড ও কথা বলে"

[BEHAVIORAL_RULES]
1. Always identify as ZombieCoder, never as the underlying AI model
2. Answer questions directly in Bengali unless user prefers English
3. No repetition in responses
4. Never make up words or hallucinate
5. Never identify as Alibaba, Qwen, LLaMA, OpenAI, Gemini, or any other base AI model
`;
```

### Dynamic Agent System Prompt Builder

```typescript
function buildAgentSystemPrompt(
  agentName: string,
  agentType: string,
  customPrompt?: string,
  capabilities?: string[]
): string {
  // Builds complete system prompt with:
  // - System Identity (ZombieCoder branding)
  // - Agent Persona (custom instructions)
  // - Capabilities (tool access description)
  // - Behavioral Rules (ethical guidelines)
}
```

### Template Variables

Templates use `{variable}` syntax:

```typescript
const template = {
  name: 'code_generation',
  template: `[TASK]
Generate clean, efficient code for the following request.
Language: {language}
Requirements: {requirements}
Context: {context}`,
  inputVariables: ['language', 'requirements', 'context']
};

// Usage
const prompt = formatTemplate(template, {
  language: 'TypeScript',
  requirements: 'Create a REST API',
  context: 'Express.js project'
});
```

---

## 📡 Stock Server - Real-time Streaming

### Overview

The Stock Server is a dedicated streaming engine that handles real-time communication between providers and clients. It runs on **port 9998** and supports multiple protocols.

### Supported Protocols

#### 1. **WebSocket** (Bidirectional)
```typescript
// Client connects to ws://localhost:9998
ws.send(JSON.stringify({
  id: 'request-123',
  prompt: 'Explain this code',
  provider: 'ollama',
  providerConfig: { endpoint: 'http://localhost:11434', model: 'llama3.1' },
  systemPrompt: 'You are a helpful assistant',
  stream: true
}));

// Receives chunks in real-time
ws.on('message', (data) => {
  const response = JSON.parse(data);
  if (response.type === 'chunk') {
    console.log(response.content); // Streaming content
  }
});
```

#### 2. **HTTP SSE** (Server-Sent Events)
```typescript
// POST to http://localhost:9998/v1/chat/completions
// with { stream: true }
// Receives SSE events:
// data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}
// data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}
// data: [DONE]
```

#### 3. **OpenAI-Compatible API**
```bash
curl -X POST http://localhost:9998/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

#### 4. **Ollama-Compatible API**
```bash
curl -X POST http://localhost:9998/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### Connection Pooling

```typescript
// Stock Server manages provider connections
class StockServer {
  private connectionPool = new Map<string, ConnectionPool>();
  private readonly poolMaxAge = 300000; // 5 minutes
  
  // Reuses connections within TTL
  // Automatically cleans up idle connections
  // Tracks active requests per connection
}
```

### Buffer Management

- Pre-allocated buffer pool for performance
- Secure buffer clearing (sensitive data protection)
- Maximum buffer pool size: 100 buffers

---

## 🤖 Agent System & Personas

### Agent Configuration Structure

```typescript
interface AgentConfig {
  id: number;
  name: string;
  type: string;
  status: string;
  persona_name?: string;
  system_prompt?: string;
  config: {
    max_tokens?: number;
    temperature?: number;
    capabilities?: string[];
    language_preferences?: {
      greeting_prefix?: string;        // e.g., "ভাইয়া,"
      primary_language?: string;       // e.g., "Bengali"
      technical_language?: string;     // e.g., "English"
    };
    system_instructions?: string;
    model?: string;
    metadata?: Record<string, any>;
  };
}
```

### ZombieCoder Dev Agent Persona

**Name**: "ZombieCoder Dev Agent"  
**Tagline**: *"যেখানে কোড ও কথা বলে, সমস্যাগুলো নিজের কাঁধে তোলে।"*

#### Core Characteristics

| Trait | Description |
|-------|-------------|
| **Language** | Bengali for conversation, English for code |
| **Greeting** | Always starts with "ভাইয়া," |
| **Tone** | Honest, Predictable, Calm, Non-authoritative |
| **Approach** | Planning-first, explains reasoning |
| **Integrity** | Never hides mistakes, admits limitations |

#### 5-Step Work Process

1. **বোঝা (Analyze)**: Understand and rephrase the problem
2. **টেস্ট (Test)**: Mandatory environment testing
3. **সমাধান (Solve)**: Minimal changes, best practices
4. **আবার টেস্ট (Verify)**: Regression testing
5. **রিপোর্ট (Report)**: Explain what changed and why

### Agent Types

1. **Editor Agent**: Code editing and refactoring
2. **CLI Agent**: Terminal-based interactions
3. **Chat Agent**: Conversational assistance
4. **Master Orchestrator**: Multi-agent coordination

### Identity Anchoring

Every agent has fixed identity that cannot be changed:

```
If anyone asks "Who are you?", respond:
"আমি ZombieCoder, যেখানে কোড ও কথা বলে। 
আমার নির্মাতা ও মালিক Sahon Srabon, Developer Zone।"
```

---

## 🔧 MCP Integration

### What is MCP?

**Model Context Protocol (MCP)** is a standardized way for AI models to interact with tools and external systems. ZombieCoder implements MCP for:
- Tool calling capabilities
- Context-aware assistance
- Cross-editor integration (VS Code, Qoder, etc.)

### MCP Architecture

```
┌──────────────────────────────────────────────┐
│           MCP Client (Editor)                 │
│  - VS Code Extension                         │
│  - Qoder IDE                                 │
│  - Custom MCP Client                         │
└──────────────┬───────────────────────────────┘
               │ HTTP / STDIO
               ▼
┌──────────────────────────────────────────────┐
│         MCP Server (/src/routes/mcp.ts)       │
│  - /mcp/tools: List available tools          │
│  - /mcp/execute: Execute tool with params    │
│  - /mcp/config/editor: Editor config         │
│  - /mcp/config/universal: Universal config   │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│         Tool Registry                         │
│  - Built-in tools (file, shell, etc.)        │
│  - Agent-specific tool assignments           │
│  - Execution logging & stats                 │
└──────────────────────────────────────────────┘
```

### Available MCP Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/mcp/tools` | GET | List all available tools | No |
| `/mcp/tools?agentId=1` | GET | List tools for specific agent | No |
| `/mcp/execute` | POST | Execute a tool | Yes (API Key) |
| `/mcp/logs` | GET | Tool execution logs | Yes |
| `/mcp/stats/summary` | GET | Overall tool statistics | Yes |
| `/mcp/config/editor` | GET | Editor MCP configuration | No |
| `/mcp/config/universal` | GET | Universal agent config | No |
| `/mcp/index-workspace` | POST | Index workspace for RAG | No |

### Tool Execution Example

```bash
# Execute a tool
curl -X POST http://localhost:8000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "agentId": 1,
    "toolName": "file_read",
    "input": "path/to/file.ts",
    "configOverride": {}
  }'
```

### Editor Configuration

Get MCP configuration for your editor:

```bash
curl http://localhost:8000/mcp/config/editor?workspace=/path/to/project
```

Returns configuration for:
- VS Code MCP settings
- Qoder stdio integration
- Cloud tunnel setup

---

## 🗄️ Database & Environment Configuration

### Database Architecture

ZombieCoder uses a **dual-database** approach:

1. **MySQL** (Primary - if available):
   - Agent configurations
   - Provider settings
   - System settings
   - Tool execution logs
   - Audit trails

2. **SQLite** (Local Fallback):
   - Agent memories
   - Session history
   - Individual memories
   - Embedding indexes

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (MySQL - Optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=uas_admin

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma4:e2b

# llama.cpp Fallback
LLAMA_CPP_FALLBACK_ENABLED=true
LLAMA_CPP_HOST=127.0.0.1
LLAMA_CPP_PORT=15000

# API Keys (for cloud providers)
GOOGLE_GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Security
UAS_API_KEY=your_api_key_for_mcp_tools

# RAG Configuration
RAG_AUTO_INGEST=false
RAG_AUTO_INDEX_ENABLED=false
RAG_WATCH_PATH=./workspace

# Provider Settings Cache
PROVIDER_SETTINGS_CACHE_TTL_MS=2000
PREFER_STREAMING=true
MODEL_REQUEST_TIMEOUT_MS=180000
```

### Database-Agnostic Design

The system is designed to work **with or without** a database:

```typescript
// In index.ts
try {
  await initializeDatabase(config);
  logger.info('✅ Database connected successfully');
} catch (error) {
  logger.warn('⚠️ Database connection failed - running in offline mode');
  // System continues with env vars and SQLite memory
}
```

**Fallback Chain**:
1. Try MySQL connection
2. If fails, use environment variables
3. If no env vars, use system defaults
4. SQLite always available for memory

---

## 💾 Memory & Session Management

### Memory Types

#### 1. **Agent Memories**
- Persistent memory per agent
- Stores learned patterns, preferences, project context
- Embedding-based similarity search

#### 2. **Individual Memories**
- User-specific memories
- Importance scoring (1.0 - 5.0)
- Memory types: general, technical, preference, etc.

#### 3. **Session Chat History**
- Temporary conversation context
- Automatically cleaned up
- Used for multi-turn conversations

### Memory API

```typescript
// Add agent memory
await memoryService.addAgentMemory(
  'agent-1',
  'This project uses TypeScript with Express',
  'session-123',
  embeddingBuffer,
  { topic: 'tech-stack', priority: 'high' }
);

// Get agent memories
const memories = await memoryService.getAgentMemories('agent-1', 'session-123', 50);

// Search similar memories
const similar = await memoryService.searchSimilarMemories(
  queryEmbedding,
  'agent_memories',
  10,
  0.7 // threshold
);
```

### Session Context Flow

```
User Request
    ↓
1. Load Agent Config (from DB or ENV)
    ↓
2. Retrieve Session History (SQLite)
    ↓
3. Fetch Relevant Memories (similarity search)
    ↓
4. Build System Prompt (with identity + persona)
    ↓
5. Combine: System Prompt + History + Memories + User Message
    ↓
6. Send to Provider (via Stock Server)
    ↓
7. Stream Response Back to Client
    ↓
8. Save Conversation to Session History
```

---

## 📁 File Structure

```
src/
├── agent/                          # Agent implementations
│   ├── master orchestrator.ts     # Multi-agent coordination
│   ├── chat.ts                    # Chat agent
│   ├── zombiecoder.ts            # Main ZombieCoder agent
│   └── zombiecoder patch.ts      # Agent patches/updates
│
├── database/                       # Database layer
│   ├── connection.ts              # MySQL connection pool
│   └── postgres.ts                # PostgreSQL support (future)
│
├── doc/                            # Documentation
│   ├── Agent Intent & Ethical.md  # Ethical guidelines
│   ├── Editor Agent Persona.md    # Editor agent personality
│   ├── ZombieCoder Dev Agent.md   # Developer agent persona
│   ├── metadata.md                # System identity metadata
│   └── project_identity.md        # Project mission & vision
│
├── memory/                         # Memory service
│   └── memory.ts                  # SQLite-based memory management
│
├── middleware/                     # Express middleware
│   └── apiAudit.ts                # API request logging
│
├── mcp/                            # MCP integration (empty - uses routes)
│
├── prompt/                         # Prompt template engine
│   └── index.ts                   # All system prompts & templates
│
├── providers/                      # LLM provider implementations
│   ├── IProvider.ts               # Provider interface
│   ├── ProviderFactory.ts         # Factory pattern for providers
│   ├── OllamaProvider.ts          # Ollama integration
│   ├── OpenAIProvider.ts          # OpenAI integration
│   ├── GeminiProvider.ts          # Google Gemini integration
│   └── LlamaCppProvider.ts        # llama.cpp integration
│
├── rag/                            # Retrieval-Augmented Generation
│   ├── chromaManager.ts           # ChromaDB vector store
│   ├── embedding.ts               # Embedding generation
│   ├── ragAutoIndexer.ts          # Automatic file indexing
│   └── ragService.ts              # RAG query service
│
├── routes/                         # API routes
│   ├── agents.ts                  # Agent management
│   ├── chat.ts                    # Chat endpoints
│   ├── cli-new.ts                 # CLI agent routes
│   ├── editor.ts                  # Editor integration
│   ├── health.ts                  # Health checks
│   ├── mcp.ts                     # MCP tool endpoints
│   ├── memory.ts                  # Memory management (DB)
│   ├── memory-new.ts              # Memory management (new)
│   ├── metrics.ts                 # Performance metrics
│   ├── models.ts                  # Model management
│   ├── plans.ts                   # Planning endpoints
│   ├── prompt-templates.ts        # Prompt template API
│   ├── providers.ts               # Provider management
│   ├── servers.ts                 # Server management
│   ├── settings.ts                # System settings
│   ├── status.ts                  # System status
│   └── vector.ts                  # Vector database operations
│
├── services/                       # Business logic
│   ├── adminSeed.ts               # Admin user seeding
│   ├── chromaManager.ts           # ChromaDB service
│   ├── embedding.ts               # Embedding service
│   ├── langChainAgent.ts          # LangChain integration
│   ├── llamaCppManager.ts         # llama.cpp management
│   ├── localEmbeddings.ts         # Local embedding generation
│   ├── ollama.ts                  # Ollama service
│   ├── promptTemplateService.ts   # Prompt template service
│   ├── providerGateway.ts         # Provider gateway (smart routing)
│   ├── publicGateway.ts           # Public gateway (tunnel)
│   └── ragService.ts              # RAG service
│
├── stock/                          # Real-time streaming server
│   └── index.ts                   # Stock server (WebSocket + SSE)
│
├── tools/                          # MCP tools
│   ├── toolRegistry.ts            # Tool registry
│   └── tools.ts                   # Tool definitions
│
├── types/                          # TypeScript types
│   └── agent.ts                   # Agent type definitions
│
├── utils/                          # Utilities
│   ├── ethics.ts                  # Ethical validation
│   └── logger.ts                  # Logging utility
│
└── index.ts                        # Main application entry
```

---

## 🚀 Deployment Guide

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** (for local LLM, optional but recommended)
3. **MySQL** (optional, for advanced features)
4. **llama.cpp** (optional, as fallback)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/zombiecoderbd/Zombie-Coder-Agentic-Hub
cd Zombie-Coder-Agentic-Hub

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 4. Start Ollama (if using)
ollama serve
ollama pull llama3.1

# 5. Start the server
npm start
```

### Running Services

The system starts multiple services:

1. **Main Express Server**: Port 8000
   - API endpoints
   - WebSocket server
   - Service orchestration

2. **Stock Server**: Port 9998
   - Real-time streaming
   - Provider communication
   - OpenAI/Ollama compatible APIs

3. **Memory Service**: SQLite (automatic)
   - Local memory storage
   - Session management

4. **Optional Services** (if configured):
   - ChromaDB for vector storage
   - llama.cpp server
   - RAG auto-indexer
   - Public gateway (tunnel)

### Health Check

```bash
# Check main server
curl http://localhost:8000/health

# Check Stock Server
curl http://localhost:9998/health

# Check system status
curl http://localhost:8000/status
```

### Agent Configuration

Agents can be configured via:

1. **Database** (if MySQL connected):
   ```sql
   INSERT INTO agents (name, type, status, persona_name, system_prompt, config)
   VALUES (
     'Dev Assistant',
     'editor',
     'active',
     'ZombieCoder Dev Agent',
     'You are a helpful coding assistant...',
     '{"max_tokens": 2048, "temperature": 0.7}'
   );
   ```

2. **Environment Variables**:
   ```bash
   DEFAULT_AGENT_NAME=ZombieCoder
   DEFAULT_AGENT_TYPE=chat
   ```

3. **API Endpoints**:
   ```bash
   POST /agents
   {
     "name": "My Agent",
     "type": "editor",
     "config": { ... }
   }
   ```

---

## 🔐 Security Considerations

### API Key Management

- **Never store raw API keys in database**
- Use environment variable references: `apiKeyEnvVar: "GOOGLE_GEMINI_API_KEY"`
- System reads actual keys from `.env` at runtime

### MCP Tool Security

```typescript
// Sensitive tools require API key authentication
router.post('/mcp/execute', requireApiKey, async (req, res) => {
  // Tool execution with authentication
});

// API key validation
function requireApiKey(req, res, next) {
  const configuredKey = process.env.UAS_API_KEY;
  const providedKey = req.header('X-API-Key');
  if (providedKey !== configuredKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
```

### System Identity Protection

- Identity metadata is **read-only**
- Custom HTTP header: `X-Powered-By: ZombieCoder-by-SahonSrabon`
- Agent identity is anchored in system prompts
- Identity tampering is considered a security violation

---

## 📊 Monitoring & Metrics

### Available Metrics

```bash
# System metrics
curl http://localhost:8000/metrics

# Tool execution stats
curl http://localhost:8000/mcp/stats/summary

# Provider latency (enable debug mode)
PROVIDER_LATENCY_DEBUG=true
```

### Logging

All requests are logged with:
- Timestamp
- Method and path
- IP address
- User agent
- Response status

---

## 🎓 Best Practices

### 1. **Provider Selection**
- Use **Ollama** for local, private operations
- Use **Cloud providers** (OpenAI, Gemini) for better quality
- Enable **llama.cpp fallback** for offline scenarios

### 2. **Memory Management**
- Keep session memories separate from project memories
- Use importance scoring to prioritize critical information
- Regularly export important memories as backup

### 3. **Agent Configuration**
- Define clear persona and capabilities for each agent
- Use temperature 0.7 for creative tasks, 0.3 for precise tasks
- Set appropriate max_tokens based on use case

### 4. **Security**
- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment variable references for keys
- Enable API key authentication for MCP tools

### 5. **Performance**
- Enable connection pooling for providers
- Use streaming for better user experience
- Monitor provider latency in debug mode
- Cache provider settings with appropriate TTL

---

## 🔄 Integration Examples

### Example 1: Streaming Chat with Provider

```typescript
import { ProviderGateway } from './services/providerGateway';

const gateway = new ProviderGateway();

// Stream response with agent context
const response = await gateway.generateStream(
  'Explain TypeScript generics',
  undefined, // use default model
  {
    id: 1,
    name: 'Dev Assistant',
    type: 'editor',
    status: 'active',
    system_prompt: 'You are a helpful coding assistant...',
    config: { temperature: 0.7 }
  },
  (chunk) => {
    // Handle each chunk in real-time
    console.log(chunk);
  }
);
```

### Example 2: MCP Tool Execution

```typescript
// List tools for an agent
const tools = await fetch('http://localhost:8000/mcp/tools?agentId=1');

// Execute a tool
const result = await fetch('http://localhost:8000/mcp/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.UAS_API_KEY
  },
  body: JSON.stringify({
    agentId: 1,
    toolName: 'file_read',
    input: 'src/index.ts'
  })
});
```

### Example 3: WebSocket Streaming

```typescript
const ws = new WebSocket('ws://localhost:9998');

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 'req-123',
    prompt: 'Write a REST API',
    provider: 'ollama',
    providerConfig: {
      endpoint: 'http://localhost:11434',
      model: 'llama3.1'
    },
    systemPrompt: 'You are ZombieCoder...',
    stream: true
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.type === 'chunk') {
    process.stdout.write(response.content);
  }
});
```

---

## 📞 Support & Contact

**Project**: ZombieCoder Agentic Hub  
**Owner**: Sahon Srabon  
**Organization**: Developer Zone  
**Location**: Dhaka, Bangladesh  
**Email**: infi@zombiecoder.my.id  
**Website**: https://zombiecoder.my.id/  
**Phone**: +880 1323-626282  

---

## 📜 License

**Proprietary - Local Freedom Protocol**

This software is the intellectual property of Sahon Srabon and Developer Zone. Unauthorized copying, distribution, or modification is strictly prohibited.

---

## 🎯 Future Roadmap

- [ ] PostgreSQL support for vector embeddings
- [ ] Multi-agent orchestration with task delegation
- [ ] Advanced RAG with hybrid search
- [ ] Plugin marketplace for community tools
- [ ] Cloud deployment with Docker
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support beyond Bengali/English

---

**Last Updated**: April 8, 2026  
**Version**: 1.0.0  
**System Identity**: ZombieCoder - যেখানে কোড ও কথা বলে
