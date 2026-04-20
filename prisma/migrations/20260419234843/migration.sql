-- CreateTable
CREATE TABLE "SystemIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'zombiecoder-v1',
    "name" TEXT NOT NULL DEFAULT 'ZombieCoder',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "tagline" TEXT NOT NULL DEFAULT 'যেখানে কোড ও কথা বলে',
    "owner" TEXT NOT NULL DEFAULT 'Sahon Srabon',
    "organization" TEXT NOT NULL DEFAULT 'Developer Zone',
    "address" TEXT NOT NULL DEFAULT '235 South Pirarbag, Amtala Bazar, Mirpur - 60 feet',
    "location" TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
    "phone" TEXT NOT NULL DEFAULT '+880 1323-626282',
    "email" TEXT NOT NULL DEFAULT 'infi@zombiecoder.my.id',
    "website" TEXT NOT NULL DEFAULT 'https://zombiecoder.my.id/',
    "license" TEXT NOT NULL DEFAULT 'Proprietary - Local Freedom Protocol',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "endpoint" TEXT,
    "model" TEXT,
    "apiKeyEnvVar" TEXT,
    "config" TEXT NOT NULL DEFAULT '{}',
    "lastHealthCheck" DATETIME,
    "latencyMs" INTEGER,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "personaName" TEXT,
    "systemPrompt" TEXT,
    "description" TEXT,
    "config" TEXT NOT NULL DEFAULT '{}',
    "providerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "importance" REAL NOT NULL DEFAULT 3.0,
    "sessionId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentMemory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndividualMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL DEFAULT 'general',
    "importance" REAL NOT NULL DEFAULT 3.0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT,
    "providerId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChatSession_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "tokenCount" INTEGER,
    "latencyMs" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "McpTool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "inputSchema" TEXT NOT NULL DEFAULT '{}',
    "requiredAuth" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentToolAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentToolAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentToolAssignment_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "McpTool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ToolExecutionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "agentId" TEXT,
    "sessionId" TEXT,
    "inputParams" TEXT NOT NULL DEFAULT '{}',
    "outputResult" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "executionMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ToolExecutionLog_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "McpTool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApiAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" TEXT,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EditorClientConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" DATETIME,
    "lastPingAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EditorSessionBinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EditorSessionBinding_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "EditorClientConnection" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EditorSessionBinding_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EditorWsRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "clientId" TEXT NOT NULL,
    "editorSessionId" TEXT,
    "messageType" TEXT,
    "providerType" TEXT,
    "model" TEXT,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EditorWsRequestLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "EditorClientConnection" ("clientId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "inputVariables" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'general',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AuthUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentMemory_agentId_idx" ON "AgentMemory"("agentId");

-- CreateIndex
CREATE INDEX "AgentMemory_topic_idx" ON "AgentMemory"("topic");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "McpTool_name_key" ON "McpTool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentToolAssignment_agentId_toolId_key" ON "AgentToolAssignment"("agentId", "toolId");

-- CreateIndex
CREATE INDEX "ToolExecutionLog_toolId_idx" ON "ToolExecutionLog"("toolId");

-- CreateIndex
CREATE INDEX "ToolExecutionLog_createdAt_idx" ON "ToolExecutionLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "ApiAuditLog_path_idx" ON "ApiAuditLog"("path");

-- CreateIndex
CREATE INDEX "ApiAuditLog_createdAt_idx" ON "ApiAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EditorClientConnection_clientId_key" ON "EditorClientConnection"("clientId");

-- CreateIndex
CREATE INDEX "EditorClientConnection_sessionId_idx" ON "EditorClientConnection"("sessionId");

-- CreateIndex
CREATE INDEX "EditorClientConnection_connectedAt_idx" ON "EditorClientConnection"("connectedAt");

-- CreateIndex
CREATE INDEX "EditorSessionBinding_chatSessionId_idx" ON "EditorSessionBinding"("chatSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorSessionBinding_clientId_chatSessionId_key" ON "EditorSessionBinding"("clientId", "chatSessionId");

-- CreateIndex
CREATE INDEX "EditorWsRequestLog_clientId_idx" ON "EditorWsRequestLog"("clientId");

-- CreateIndex
CREATE INDEX "EditorWsRequestLog_createdAt_idx" ON "EditorWsRequestLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_name_key" ON "PromptTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_email_key" ON "AuthUser"("email");

-- CreateIndex
CREATE INDEX "AuthUser_email_idx" ON "AuthUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");

-- CreateIndex
CREATE INDEX "AuthSession_token_idx" ON "AuthSession"("token");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
