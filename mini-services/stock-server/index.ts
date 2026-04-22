#!/usr/bin/env bun
/**
 * ZombieCoder WebSocket Server v2.0
 * Experimental Agent-First Architecture
 * 
 * Architecture Principles:
 * 1. Agent-first: Every conversation starts with agent selection
 * 2. Gateway-mediated: Uses main app API, never direct provider
 * 3. Unified sessions: Integrates with main ChatSession system
 * 4. Standard events: Consistent JSON format for all messages
 * 5. Heartbeat with ACK: Proper ping-pong for connection health
 * 6. Transparent identity: Clean ZombieCoder branding
 * 
 * @author Sahon Srabon
 * @version 2.0.0
 */

import type { ServerWebSocket } from "bun";

// ─── Configuration ─────────────────────────────────────────────────────────
const SERVER_PORT = Number(process.env.WS_PORT || 9998);
const NEXTJS_BASE_URL = process.env.NEXTJS_BASE_URL || "http://localhost:3000";
const CLIENT_IDLE_TIMEOUT_MS = Number(process.env.WS_IDLE_TIMEOUT_MS || 30 * 60 * 1000); // default: 30 minutes
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const HEARTBEAT_TIMEOUT_MS = 60_000; // 60 seconds for ACK
const HTTP_TIMEOUT_MS = Number(process.env.WS_HTTP_TIMEOUT_MS || 6_000);
const STREAM_TIMEOUT_MS = Number(process.env.WS_STREAM_TIMEOUT_MS || 5 * 60 * 1000);

const STOCK_SERVER_BEARER_TOKEN =
  process.env.STOCK_SERVER_BEARER_TOKEN || process.env.MCP_BEARER_TOKEN || process.env.UAS_API_KEY || null;

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebSocketClient {
  ws: ServerWebSocket<McpWebSocketData>;
  clientId: string;
  sessionId: string;
  hasRealSession: boolean; // true if session exists in DB
  agentId?: string;
  kind: "unknown" | "browser" | "editor";
  clientName?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
  lastPing: number;
  lastPong: number;
  lastActivity: number;
  heartbeatIntervalId: Timer;
  heartbeatTimeoutId?: Timer;
  timeoutId: Timer;
  isAlive: boolean;
}

interface StandardEvent {
  version: "2.0";
  timestamp: string;
  event: string;
  agentId?: string;
  sessionId?: string;
  conversationId?: string;
  payload?: Record<string, unknown>;
  error?: string;
}

interface ChatRequest {
  type: "chat.start";
  agentId: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  sessionId?: string;
  stream?: boolean;
}

interface AgentSelectRequest {
  type: "agent.select";
  agentId: string;
}

interface HeartbeatPong {
  type: "heartbeat.pong";
  timestamp: string;
}

interface ClientRegisterRequest {
  type: "client.register";
  kind?: "browser" | "editor";
  name?: string;
}

interface SessionResumeRequest {
  type: "session.resume";
  sessionId: string;
}

interface SessionClearRequest {
  type: "session.clear";
}

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type McpWebSocketData = {
  ipAddress: string | null;
  userAgent: string | null;
  clientId?: string;
};

// ─── State Management ───────────────────────────────────────────────────────

const activeClients = new Map<string, WebSocketClient>();

const mcpSessions = new Map<
  string,
  {
    createdAt: number;
    send: (payload: unknown) => boolean;
    close: () => void;
    keepAliveIntervalId?: Timer;
  }
>();

let lastMcpSessionId: string | null = null;

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(level: "INFO" | "WARN" | "ERROR", clientId: string, message: string): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${clientId || "SYSTEM"}]`;
  console.log(`${prefix} ${message}`);
}

// ─── Event Builder ───────────────────────────────────────────────────────────

function buildEvent(
  eventType: string,
  client: WebSocketClient,
  payload?: Record<string, unknown>,
  error?: string
): StandardEvent {
  return {
    version: "2.0",
    timestamp: new Date().toISOString(),
    event: eventType,
    agentId: client.agentId,
    sessionId: client.sessionId,
    payload,
    error,
  };
}

// ─── Session Management ──────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number = HTTP_TIMEOUT_MS): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...init, signal });

}

function sseFormatMessage(data: unknown, eventName: string = "message"): string {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${eventName}\ndata: ${payload}\n\n`;
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function getTokenFromRequest(req: Request): string | null {
  const headerToken = extractBearerToken(req.headers.get("authorization"));
  if (headerToken) return headerToken;
  try {
    const url = new URL(req.url);
    return url.searchParams.get("token") || url.searchParams.get("access_token") || null;
  } catch {
    return null;
  }
}

function isRequestAuthorized(req: Request): boolean {
  if (!STOCK_SERVER_BEARER_TOKEN) return true;
  const token = getTokenFromRequest(req);
  return Boolean(token && token === STOCK_SERVER_BEARER_TOKEN);
}

function createMcpSseStream(req: Request, sessionId: string): Response {
  const encoder = new TextEncoder();
  const origin = new URL(req.url).origin;

  let isClosed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      const existing = mcpSessions.get(sessionId);
      if (existing) {
        existing.close();
      }

      const send = (payload: unknown) => {
        if (isClosed || !controllerRef) return false;
        try {
          controllerRef.enqueue(encoder.encode(sseFormatMessage(payload, "message")));
          return true;
        } catch {
          return false;
        }
      };

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controllerRef?.close();
        } catch {}
      };

      const keepAliveIntervalId = setInterval(() => {
        if (isClosed || !controllerRef) return;
        try {
          controllerRef.enqueue(encoder.encode(`:keep-alive\n\n`));
        } catch {}
      }, 25_000);

      mcpSessions.set(sessionId, {
        createdAt: Date.now(),
        send,
        close,
        keepAliveIntervalId,
      });

      lastMcpSessionId = sessionId;

      controller.enqueue(
        encoder.encode(
          sseFormatMessage(
            {
              sessionId,
              url: `${origin}/message?sessionId=${sessionId}`,
            },
            "endpoint"
          )
        )
      );
    },
    cancel() {
      const existing = mcpSessions.get(sessionId);
      if (existing?.keepAliveIntervalId) clearInterval(existing.keepAliveIntervalId);
      mcpSessions.delete(sessionId);
      isClosed = true;
      if (lastMcpSessionId === sessionId) {
        lastMcpSessionId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function handleMcpHttpMessage(req: Request, sessionId: string): Promise<Response> {
  const session = mcpSessions.get(sessionId) || null;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requests = Array.isArray(payload) ? payload : [payload];
  const out: JsonRpcResponse[] = [];
  for (const item of requests) {
    const msg = item as Partial<JsonRpcRequest>;
    if (msg?.jsonrpc !== "2.0" || typeof msg?.method !== "string") {
      continue;
    }
    const responses = await handleMcpJsonRpc(msg as JsonRpcRequest);

    if (session) {
      for (const res of responses) {
        session.send(res);
      }
    } else {
      out.push(...responses);
    }
  }

  if (session) {
    return new Response(null, { status: 202 });
  }

  if (out.length === 0) {
    return Response.json({ ok: true }, { status: 200 });
  }
  return Response.json(out.length === 1 ? out[0] : out, { status: 200 });
}

async function handleMcpJsonRpc(message: JsonRpcRequest): Promise<JsonRpcResponse[]> {
  const id: JsonRpcId = message.id ?? null;
  const respond = (result?: unknown, error?: { code: number; message: string; data?: unknown }): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id,
    ...(error ? { error } : { result: result ?? null }),
  });

  if (id === null) {
    return [];
  }

  if (message.method === "initialize") {
    return [
      respond({
        protocolVersion: "2024-11-05",
        serverInfo: { name: "stock-server", version: "2.0.0" },
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }),
    ];
  }

  if (message.method === "tools/list") {
    const tools: McpTool[] = [
      {
        name: "stock.health",
        description: "Returns health info from the stock-server (self-check).",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "stock.clients",
        description: "Lists currently connected websocket clients tracked by the stock-server.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "ws.send",
        description: "Send a standard event payload to a connected websocket client/session (best-effort).",
        inputSchema: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            sessionId: { type: "string" },
            event: { type: "string" },
            payload: { type: "object" },
          },
          required: ["event"],
          additionalProperties: true,
        },
      },
    ];
    return [respond({ tools })];
  }

  if (message.method === "tools/call") {
    const params = (message.params ?? {}) as any;
    const name = params?.name;
    const args = (params?.arguments ?? {}) as Record<string, unknown>;

    const toolOk = (text: string, data?: unknown) =>
      respond({
        content: [{ type: "text", text }],
        ...(data !== undefined ? { data } : {}),
      });
    const toolErr = (text: string, data?: unknown) =>
      respond({
        content: [{ type: "text", text }],
        isError: true,
        ...(data !== undefined ? { data } : {}),
      });

    if (typeof name !== "string") {
      return [respond(undefined, { code: -32602, message: "Invalid params: missing tool name" })];
    }

    if (name === "stock.health") {
      return [toolOk("ok", { status: "ok", clients: activeClients.size, version: "2.0.0" })];
    }

    if (name === "stock.clients") {
      return [toolOk("ok", getClientsSnapshot())];
    }

    if (name === "ws.send") {
      const event = typeof (args as any).event === "string" ? (args as any).event : null;
      const clientId = typeof (args as any).clientId === "string" ? (args as any).clientId : null;
      const sessionId = typeof (args as any).sessionId === "string" ? (args as any).sessionId : null;
      const payload = (args as any).payload && typeof (args as any).payload === "object" ? (args as any).payload : undefined;

      if (!event) {
        return [toolErr("Missing required field: event")];
      }

      const targets: WebSocketClient[] = [];
      if (clientId) {
        const c = activeClients.get(clientId);
        if (c) targets.push(c);
      } else if (sessionId) {
        for (const c of activeClients.values()) {
          if (c.hasRealSession && c.sessionId === sessionId) targets.push(c);
        }
      } else {
        targets.push(...activeClients.values());
      }

      const deliveredTo: string[] = [];
      for (const c of targets) {
        try {
          c.ws.send(
            JSON.stringify({
              version: "2.0",
              timestamp: new Date().toISOString(),
              event,
              sessionId: c.sessionId,
              agentId: c.agentId,
              payload: payload ?? null,
            })
          );
          deliveredTo.push(c.clientId);
        } catch {
          // ignore
        }
      }

      return [toolOk("sent", { deliveredTo })];
    }

    return [respond(undefined, { code: -32601, message: `Tool not found: ${name}` })];
  }

  if (message.method === "resources/list") {
    return [respond({ resources: [] })];
  }

  if (message.method === "prompts/list") {
    return [respond({ prompts: [] })];
  }

  if (message.method === "ping") {
    return [respond({ ok: true })];
  }

  return [respond(undefined, { code: -32601, message: `Method not found: ${message.method}` })];
}

function safeJson(text: string): any | null {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function createChatSession(params: { agentId?: string; providerId?: string; title?: string }): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(`${NEXTJS_BASE_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...(params.agentId ? { agentId: params.agentId } : {}),
        ...(params.providerId ? { providerId: params.providerId } : {}),
        ...(params.title ? { title: params.title } : {}),
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json().catch(() => null)) as any;
    const session = json?.data || json;
    const sessionId = session?.id;
    return typeof sessionId === "string" ? sessionId : null;
  } catch {
    return null;
  }
}

async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${NEXTJS_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${NEXTJS_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE", headers: { Accept: "application/json" } }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function postStockEvent(body: unknown): Promise<void> {
  try {
    await fetchWithTimeout(`${NEXTJS_BASE_URL}/api/stock/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // best-effort
  }
}

function refreshIdleTimeout(client: WebSocketClient): void {
  client.lastActivity = Date.now();
  if (client.timeoutId) clearTimeout(client.timeoutId);
  client.timeoutId = setTimeout(() => {
    log("WARN", client.clientId, `Idle timeout (${CLIENT_IDLE_TIMEOUT_MS}ms)`);
    client.ws.close(4008, "Idle timeout");
  }, CLIENT_IDLE_TIMEOUT_MS);
}

// ─── Agent Resolution ─────────────────────────────────────────────────────────

async function resolveAgent(agentId: string): Promise<{ name: string; systemPrompt: string | null; providerId: string | null } | null> {
  try {
    const response = await fetchWithTimeout(`${NEXTJS_BASE_URL}/api/agents/${agentId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const result = await response.json();
    // API returns { success: true, data: agent }
    const agent = result.data || result;
    if (!agent || !agent.name) return null;
    return {
      name: agent.name,
      systemPrompt: agent.systemPrompt || null,
      providerId: agent.providerId || (agent.provider?.id) || null,
    };
  } catch {
    return null;
  }
}

// ─── Chat Processing ─────────────────────────────────────────────────────────

async function processChat(
  client: WebSocketClient,
  request: ChatRequest
): Promise<void> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  log("INFO", client.clientId, `Starting chat with agent: ${request.agentId}`);

  // Validate agent
  const agent = await resolveAgent(request.agentId);
  if (!agent) {
    const errorEvent = buildEvent("error", client, undefined, "Agent not found");
    sendToClient(client, errorEvent);
    void postStockEvent({
      type: "ws_request_log",
      requestId,
      clientId: client.clientId,
      sessionId: client.sessionId,
      messageType: "chat",
      status: "error",
      errorMessage: "Agent not found",
      createdAt: new Date().toISOString(),
    });
    return;
  }

  // Update client's agent
  client.agentId = request.agentId;

  try {
    // Send message.start event
    const startEvent = buildEvent("message.start", client, {
      agentName: agent.name,
      timestamp: new Date().toISOString(),
      requestId,
    });
    broadcastToSession(client, startEvent);

    // Call main app API (NEVER direct provider)
    // Only send sessionId if it's confirmed by API (hasRealSession flag)
    const apiResponse = await fetchWithTimeout(`${NEXTJS_BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: request.messages,
        agentId: request.agentId,
        ...(client.hasRealSession && { sessionId: client.sessionId }),
        stream: true,
      }),
    }, STREAM_TIMEOUT_MS);

    if (!apiResponse.ok || !apiResponse.body) {
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    // Stream chunks to client
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let tokenCountEstimated = 0;
    let providerType: string | null = null;
    let model: string | null = null;
    let tokenCountReported: number | null = null;
    let latencyMsReported: number | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        const lines = block.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event: "));
        const dataLine = lines.find((l) => l.startsWith("data: "));

        if (eventLine && dataLine) {
          const event = eventLine.slice(7).trim();
          const data = safeJson(dataLine.slice(6));
          if (!data) continue;

          if (event === "chunk" && data.content) {
            tokenCountEstimated += estimateTokens(data.content);
            const chunkEvent = buildEvent("message.chunk", client, {
              ...data,
              requestId,
            });
            broadcastToSession(client, chunkEvent);
          }

          if (event === "session" && data.sessionId) {
            client.sessionId = data.sessionId;
            client.hasRealSession = true; // Mark as confirmed
            const sessionEvent = buildEvent("session.update", client, {
              sessionId: data.sessionId,
              requestId,
            });
            broadcastToSession(client, sessionEvent);
            void postStockEvent({
              type: "client_ping",
              clientId: client.clientId,
              sessionId: client.sessionId,
              pingAt: new Date().toISOString(),
            });
          }

          if (event === "done") {
            providerType = typeof data.provider === "string" ? data.provider : null;
            model = typeof data.model === "string" ? data.model : null;
            tokenCountReported = typeof data.tokenCount === "number" ? data.tokenCount : null;
            latencyMsReported = typeof data.latencyMs === "number" ? data.latencyMs : null;
          }

          if (event === "error" && data.error) {
            throw new Error(typeof data.error === "string" ? data.error : "Stream error");
          }
        }
      }
    }

    // Send message.end event
    const latency = Date.now() - startTime;
    const endEvent = buildEvent("message.end", client, {
      tokenCount: tokenCountReported ?? tokenCountEstimated,
      latencyMs: latency,
      finishReason: "stop",
      requestId,
    });
    broadcastToSession(client, endEvent);

    log("INFO", client.clientId, `Chat completed: ${tokenCountReported ?? tokenCountEstimated} tokens, ${latency}ms`);
    void postStockEvent({
      type: "ws_request_log",
      requestId,
      clientId: client.clientId,
      sessionId: client.sessionId,
      messageType: "chat",
      providerType,
      model,
      latencyMs: latencyMsReported ?? latency,
      status: "success",
      metadata: {
        tokenCount: tokenCountReported ?? tokenCountEstimated,
        agentId: client.agentId ?? null,
      },
      createdAt: new Date().toISOString(),
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log("ERROR", client.clientId, `Chat error: ${errorMessage}`);
    const errorEvent = buildEvent("error", client, undefined, errorMessage);
    sendToClient(client, errorEvent);
    void postStockEvent({
      type: "ws_request_log",
      requestId,
      clientId: client.clientId,
      sessionId: client.sessionId,
      messageType: "chat",
      status: "error",
      errorMessage,
      createdAt: new Date().toISOString(),
    });
  }
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function sendToClient(client: WebSocketClient, event: StandardEvent): void {
  try {
    client.ws.send(JSON.stringify(event));
  } catch {
    // ignore
  }
}

function broadcastToSession(sourceClient: WebSocketClient, event: StandardEvent): void {
  const payload = JSON.stringify(event);
  for (const client of activeClients.values()) {
    if (!sourceClient.hasRealSession || !client.hasRealSession) {
      if (client.clientId === sourceClient.clientId) {
        try { client.ws.send(payload); } catch {}
      }
      continue;
    }
    if (client.sessionId !== sourceClient.sessionId) continue;
    try {
      client.ws.send(payload);
    } catch {
      // ignore
    }
  }
}

function getClientsSnapshot(): { count: number; clients: Array<Record<string, unknown>> } {
  const clients = Array.from(activeClients.values()).map((c) => ({
    clientId: c.clientId,
    kind: c.kind,
    name: c.clientName || null,
    agentId: c.agentId || null,
    sessionId: c.sessionId,
    hasRealSession: c.hasRealSession,
    ipAddress: c.ipAddress ?? null,
    userAgent: c.userAgent ?? null,
    createdAt: new Date(c.createdAt).toISOString(),
    lastPingAt: new Date(c.lastPing).toISOString(),
    lastPongAt: new Date(c.lastPong).toISOString(),
    lastActivityAt: new Date(c.lastActivity).toISOString(),
    isAlive: c.isAlive,
  }));
  return { count: clients.length, clients };
}

function broadcastClientsUpdate(): void {
  const snapshot = getClientsSnapshot();
  const event: StandardEvent = {
    version: "2.0",
    timestamp: new Date().toISOString(),
    event: "clients.update",
    payload: snapshot as unknown as Record<string, unknown>,
  };
  const payload = JSON.stringify(event);
  for (const client of activeClients.values()) {
    try { client.ws.send(payload); } catch {}
  }
}

// ─── Heartbeat Management ────────────────────────────────────────────────────

function startHeartbeat(client: WebSocketClient): void {
  // Send ping every 30 seconds
  const intervalId = setInterval(() => {
    if (!client.isAlive) {
      log("WARN", client.clientId, "Client not responding, terminating");
      clearInterval(intervalId);
      client.ws.close(4008, "Heartbeat timeout");
      return;
    }

    client.isAlive = false;
    const pingEvent = buildEvent("heartbeat.ping", client, {
      timestamp: new Date().toISOString(),
    });
    
    try {
      sendToClient(client, pingEvent);
      log("INFO", client.clientId, "Heartbeat ping sent");

      // Set timeout for ACK
      client.heartbeatTimeoutId = setTimeout(() => {
        if (!client.isAlive) {
          log("WARN", client.clientId, "No heartbeat ACK received");
          client.ws.close(4008, "No heartbeat ACK");
        }
      }, HEARTBEAT_TIMEOUT_MS);

    } catch {
      // Client disconnected
    }
  }, HEARTBEAT_INTERVAL_MS);

  client.heartbeatIntervalId = intervalId;
}

function handleHeartbeatPong(client: WebSocketClient): void {
  client.isAlive = true;
  client.lastPong = Date.now();
  refreshIdleTimeout(client);
  
  // Clear the timeout
  if (client.heartbeatTimeoutId) {
    clearTimeout(client.heartbeatTimeoutId);
    client.heartbeatTimeoutId = undefined;
  }
  
  log("INFO", client.clientId, "Heartbeat pong received");
  void postStockEvent({
    type: "client_ping",
    clientId: client.clientId,
    sessionId: client.sessionId,
    pingAt: new Date().toISOString(),
  });
}

// ─── Message Handler ─────────────────────────────────────────────────────────

async function handleMessage(client: WebSocketClient, rawMessage: string): Promise<void> {
  try {
    const data = JSON.parse(rawMessage);
    const messageType = data.type || data.event;

    log("INFO", client.clientId, `Received: ${messageType}`);
    refreshIdleTimeout(client);

    switch (messageType) {
      case "client.register": {
        const req = data as ClientRegisterRequest;
        if (req.kind === "browser" || req.kind === "editor") {
          client.kind = req.kind;
        }
        if (typeof req.name === "string" && req.name.trim()) {
          client.clientName = req.name.trim().slice(0, 80);
        }
        sendToClient(client, buildEvent("client.registered", client, { kind: client.kind, name: client.clientName || null }));
        broadcastClientsUpdate();
        break;
      }

      case "session.resume": {
        const req = data as SessionResumeRequest;
        if (!req.sessionId || typeof req.sessionId !== "string") {
          sendToClient(client, buildEvent("error", client, undefined, "Missing sessionId"));
          break;
        }
        const ok = await sessionExists(req.sessionId);
        if (!ok) {
          sendToClient(client, buildEvent("error", client, undefined, "Session not found"));
          break;
        }
        client.sessionId = req.sessionId;
        client.hasRealSession = true;
        sendToClient(client, buildEvent("session.resumed", client, { sessionId: client.sessionId }));
        void postStockEvent({ type: "bind_chat_session", clientId: client.clientId, chatSessionId: client.sessionId });
        void postStockEvent({ type: "client_ping", clientId: client.clientId, sessionId: client.sessionId, pingAt: new Date().toISOString() });
        broadcastClientsUpdate();
        break;
      }

      case "session.clear": {
        const _req = data as SessionClearRequest;
        if (client.hasRealSession) {
          await deleteSession(client.sessionId);
        }
        client.sessionId = crypto.randomUUID();
        client.hasRealSession = false;
        client.agentId = undefined;
        sendToClient(client, buildEvent("session.cleared", client, { sessionId: client.sessionId }));
        void postStockEvent({ type: "client_ping", clientId: client.clientId, sessionId: client.sessionId, pingAt: new Date().toISOString() });
        broadcastClientsUpdate();
        break;
      }

      case "agent.select":
        const agentRequest = data as AgentSelectRequest;
        client.agentId = agentRequest.agentId;
        const agent = await resolveAgent(agentRequest.agentId);
        
        if (agent) {
          if (!client.hasRealSession) {
            const created = await createChatSession({
              agentId: agentRequest.agentId,
              providerId: agent.providerId || undefined,
              title: `WS: ${agent.name}`,
            });
            if (created) {
              client.sessionId = created;
              client.hasRealSession = true;
              sendToClient(client, buildEvent("session.update", client, { sessionId: created }));
              void postStockEvent({ type: "bind_chat_session", clientId: client.clientId, chatSessionId: client.sessionId });
              void postStockEvent({ type: "client_ping", clientId: client.clientId, sessionId: client.sessionId, pingAt: new Date().toISOString() });
            }
          }
          const confirmEvent = buildEvent("agent.selected", client, {
            agentId: agentRequest.agentId,
            agentName: agent.name,
          });
          sendToClient(client, confirmEvent);
          log("INFO", client.clientId, `Agent selected: ${agent.name}`);
          broadcastClientsUpdate();
        } else {
          const errorEvent = buildEvent("error", client, undefined, "Agent not found");
          sendToClient(client, errorEvent);
        }
        break;

      case "chat.start":
        const chatRequest = data as ChatRequest;
        if (!chatRequest.agentId && !client.agentId) {
          const errorEvent = buildEvent("error", client, undefined, "No agent selected");
          sendToClient(client, errorEvent);
          return;
        }
        // Use request agentId or fall back to client's selected agent
        chatRequest.agentId = chatRequest.agentId || client.agentId!;
        if (!client.hasRealSession) {
          const resolved = await resolveAgent(chatRequest.agentId);
          const created = await createChatSession({
            agentId: chatRequest.agentId,
            providerId: resolved?.providerId || undefined,
            title: resolved?.name ? `WS: ${resolved.name}` : "WS Session",
          });
          if (created) {
            client.sessionId = created;
            client.hasRealSession = true;
            sendToClient(client, buildEvent("session.update", client, { sessionId: created }));
            void postStockEvent({ type: "bind_chat_session", clientId: client.clientId, chatSessionId: client.sessionId });
            void postStockEvent({ type: "client_ping", clientId: client.clientId, sessionId: client.sessionId, pingAt: new Date().toISOString() });
            broadcastClientsUpdate();
          }
        }
        await processChat(client, chatRequest);
        break;

      case "heartbeat.pong":
        handleHeartbeatPong(client);
        break;

      default:
        log("WARN", client.clientId, `Unknown message type: ${messageType}`);
        const errorEvent = buildEvent("error", client, undefined, `Unknown type: ${messageType}`);
        sendToClient(client, errorEvent);
    }

  } catch (err) {
    log("ERROR", client.clientId, `Message parse error: ${err}`);
    const errorEvent = buildEvent("error", client, undefined, "Invalid message format");
    sendToClient(client, errorEvent);
  }
}

// ─── WebSocket Server ─────────────────────────────────────────────────────────

const server = Bun.serve<McpWebSocketData>({
  port: SERVER_PORT,
  hostname: "0.0.0.0",
  idleTimeout: 0,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/sse" && req.method === "GET") {
      if (!isRequestAuthorized(req)) {
        return new Response("Unauthorized", { status: 401 });
      }
      const sessionId = url.searchParams.get("sessionId") || crypto.randomUUID();
      return createMcpSseStream(req, sessionId);
    }

    if (url.pathname === "/message" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId") || lastMcpSessionId;
      if (!sessionId) {
        return Response.json({ error: "Missing sessionId" }, { status: 400 });
      }
      return handleMcpHttpMessage(req, sessionId);
    }

    // WebSocket upgrade endpoint
    if (url.pathname === "/ws") {
      if (!isRequestAuthorized(req)) {
        return new Response("Unauthorized", { status: 401 });
      }
      const userAgent = req.headers.get("user-agent");
      const ip = (server as any).requestIP?.(req)?.address || req.headers.get("x-forwarded-for") || null;
      const success = server.upgrade(req, {
        data: {
          ipAddress: typeof ip === "string" ? ip : null,
          userAgent: userAgent || null,
        },
      });
      if (success) {
        return undefined; // Upgraded to WebSocket
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        version: "2.0.0",
        clients: activeClients.size,
        idleTimeoutMs: CLIENT_IDLE_TIMEOUT_MS,
        timestamp: new Date().toISOString(),
      });
    }

    // Active clients snapshot
    if (url.pathname === "/clients") {
      const snapshot = getClientsSnapshot();
      return Response.json({
        success: true,
        clients: snapshot.clients,
        data: snapshot,
        timestamp: new Date().toISOString(),
      });
    }

    // Same-origin proxies for the test page (avoid CORS)
    if (url.pathname === "/api/agents" && req.method === "GET") {
      return proxyNext(req, `${NEXTJS_BASE_URL}/api/agents`);
    }
    if (url.pathname.startsWith("/api/agents/") && req.method === "GET") {
      const id = url.pathname.slice("/api/agents/".length);
      return proxyNext(req, `${NEXTJS_BASE_URL}/api/agents/${encodeURIComponent(id)}`);
    }
    if (url.pathname.startsWith("/api/sessions/") && (req.method === "GET" || req.method === "DELETE")) {
      const id = url.pathname.slice("/api/sessions/".length);
      return proxyNext(req, `${NEXTJS_BASE_URL}/api/sessions/${encodeURIComponent(id)}`);
    }

    // Test page
    if (url.pathname === "/" || url.pathname === "/test") {
      return new Response(getTestPage(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === "/mcp-audit") {
      return new Response(getMcpAuditPage(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws: ServerWebSocket<McpWebSocketData>) {
      const clientId = crypto.randomUUID();
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      const data = ws.data;

      log("INFO", clientId, "WebSocket connection established");

      // Create client record
      const client: WebSocketClient = {
        ws,
        clientId,
        sessionId,
        hasRealSession: false, // Will be set to true when API confirms
        kind: "unknown",
        ipAddress: data?.ipAddress ?? null,
        userAgent: data?.userAgent ?? null,
        createdAt: now,
        lastPing: now,
        lastPong: now,
        lastActivity: now,
        heartbeatIntervalId: null as unknown as Timer,
        timeoutId: null as unknown as Timer,
        isAlive: true,
      };

      // Set idle timeout (refreshed on activity)
      refreshIdleTimeout(client);

      // Store clientId in ws.data for retrieval in message handlers
      ws.data = {
        ipAddress: client.ipAddress ?? null,
        userAgent: client.userAgent ?? null,
        clientId,
      };

      // Store client
      activeClients.set(clientId, client);

      // Start heartbeat
      startHeartbeat(client);

      // Send session.init event
      const sessionEvent = buildEvent("session.init", client, {
        clientId,
        sessionId,
        message: "Welcome to ZombieCoder WebSocket Server v2.0",
        instructions: [
          "0. (Optional) Register client using: { type: 'client.register', kind: 'browser|editor', name: '...' }",
          "1. Select an agent using: { type: 'agent.select', agentId: '...' }",
          "2. Start chat using: { type: 'chat.start', messages: [...] }",
          "3. Respond to heartbeat.ping with heartbeat.pong",
        ],
      });
      
      ws.send(JSON.stringify(sessionEvent));

      log("INFO", clientId, `Session initialized: ${sessionId}`);
      void postStockEvent({
        type: "client_connected",
        clientId,
        sessionId,
        ipAddress: client.ipAddress ?? null,
        userAgent: client.userAgent ?? null,
        connectedAt: new Date().toISOString(),
      });
      broadcastClientsUpdate();
    },

    message(ws: ServerWebSocket<McpWebSocketData>, message) {
      const clientId = getClientId(ws);
      if (!clientId) {
        ws.close(4001, "Unknown client");
        return;
      }

      const client = activeClients.get(clientId);
      if (!client) {
        ws.close(4002, "Client not found");
        return;
      }

      // Update last activity
      client.lastPing = Date.now();
      client.lastActivity = Date.now();

      // Handle message
      const text = message.toString();
      handleMessage(client, text);
    },

    close(ws: ServerWebSocket<McpWebSocketData>, code, reason) {
      const clientId = getClientId(ws);
      if (!clientId) return;

      const client = activeClients.get(clientId);
      if (client) {
        // Cleanup
        clearInterval(client.heartbeatIntervalId);
        clearTimeout(client.timeoutId);
        if (client.heartbeatTimeoutId) {
          clearTimeout(client.heartbeatTimeoutId);
        }

        activeClients.delete(clientId);
        log("INFO", clientId, `Connection closed: code=${code}, reason=${reason || "none"}`);
        void postStockEvent({
          type: "client_disconnected",
          clientId,
          sessionId: client.sessionId,
          disconnectedAt: new Date().toISOString(),
          reason: reason ? String(reason) : null,
        });
        broadcastClientsUpdate();
      }
    },

    ping(ws: ServerWebSocket<McpWebSocketData>) {
      // Bun handles ping/pong at protocol level
      const clientId = getClientId(ws);
      if (clientId) {
        const client = activeClients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
          client.lastActivity = Date.now();
        }
      }
    },

    pong(ws: ServerWebSocket<McpWebSocketData>) {
      // Bun handles ping/pong at protocol level
      const clientId = getClientId(ws);
      if (clientId) {
        const client = activeClients.get(clientId);
        if (client) {
          client.lastPong = Date.now();
          client.lastActivity = Date.now();
        }
      }
    },
  },
});

function getClientId(ws: ServerWebSocket<McpWebSocketData>): string | undefined {
  // Store clientId in websocket data
  return ws.data?.clientId;
}

async function proxyNext(req: Request, target: string): Promise<Response> {
  try {
    const headers = new Headers(req.headers);
    headers.delete("host");

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await req.text();
    }

    const res = await fetchWithTimeout(target, init);
    const body = await res.arrayBuffer();
    const outHeaders = new Headers(res.headers);
    outHeaders.set("Cache-Control", "no-store");
    return new Response(body, { status: res.status, headers: outHeaders });
  } catch (e) {
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Proxy failed",
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}

// ─── Test Page ───────────────────────────────────────────────────────────────

function getTestPage(): string {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZombieCoder WebSocket v2.0 - Test</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
      background: radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.18), transparent 60%),
                  radial-gradient(900px 500px at 90% 0%, rgba(59,130,246,0.18), transparent 55%),
                  linear-gradient(135deg, #070a12 0%, #111827 100%);
      color: #e5e7eb;
      padding: 28px 18px;
      min-height: 100vh;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 {
      background: linear-gradient(90deg, #22c55e, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    .subtitle { color: #94a3b8; margin-bottom: 18px; }

    .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px; }
    @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }

    .card {
      background: rgba(2, 6, 23, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      backdrop-filter: blur(10px);
    }

    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row.space { justify-content: space-between; }

    .status {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 800;
    }
    .status.connected { background: #22c55e; color: white; }
    .status.disconnected { background: #ef4444; color: white; }
    .status.connecting { background: #f59e0b; color: white; }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(148, 163, 184, 0.08);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 800;
      margin-left: 10px;
    }
    .pill b { color: #e5e7eb; }

    input, select, button {
      padding: 11px 14px;
      border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(2, 6, 23, 0.75);
      color: #e5e7eb;
      font-size: 14px;
    }
    input:focus, select:focus { outline: none; border-color: rgba(34,197,94,0.65); }
    button {
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border: none;
      cursor: pointer;
      font-weight: 900;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.92; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.22);
      color: #cbd5e1;
    }
    button.danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fecaca;
    }

    .agent-badge {
      display: inline-block;
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.45);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 900;
      color: #fbbf24;
      margin-left: 10px;
    }

    .log-container {
      background: rgba(2,6,23,0.85);
      border-radius: 12px;
      padding: 14px;
      height: 420px;
      overflow-y: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .log-entry { margin-bottom: 8px; padding: 8px; border-radius: 8px; }
    .log-entry.in { background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; }
    .log-entry.out { background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; }
    .log-entry.error { background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; }
    .log-entry.system { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; }
    .timestamp { color: #64748b; font-size: 11px; }

    .clients {
      max-height: 420px;
      overflow: auto;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(2, 6, 23, 0.55);
    }
    .client-row {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr 0.9fr;
      gap: 10px;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.08);
      align-items: center;
    }
    .client-row:last-child { border-bottom: 0; }
    .client-row code { font-size: 11px; color: #cbd5e1; }
    .tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(148, 163, 184, 0.08);
      color: #cbd5e1;
    }
    .tag.ok { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.08); color: #86efac; }
    .tag.warn { border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.08); color: #fde68a; }

    .mini { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧟 ZombieCoder WebSocket v2.0</h1>
    <p class="subtitle">Browser Test UI · Real agents + session persistence (48h) <span class="pill"><b id="client-count">0</b> clients</span></p>

    <div class="grid">
      <div class="card">
        <div class="row space" style="margin-bottom: 12px;">
          <div>
            <span id="status" class="status disconnected">Disconnected</span>
            <span id="agent-badge" class="agent-badge" style="display:none">No Agent</span>
            <span class="pill">Session <b id="session-id">-</b></span>
          </div>
          <div class="row">
            <button id="connect-btn" onclick="connect()">Connect</button>
            <button id="disconnect-btn" class="secondary" onclick="disconnect()" disabled>Disconnect</button>
          </div>
        </div>

        <div class="row" style="margin-bottom: 10px;">
          <select id="agent-select" style="flex: 1; min-width: 260px;">
            <option value="">Select Agent...</option>
          </select>
          <button onclick="selectAgent()" id="select-agent-btn" disabled>Select</button>
          <button onclick="resumeSavedSession()" id="resume-btn" class="secondary" disabled>Resume (48h)</button>
          <button onclick="clearSession()" id="clear-btn" class="danger" disabled>Clear</button>
        </div>

        <div class="row">
          <input type="text" id="message-input" placeholder="Type your message..." style="flex:1; min-width: 280px;" disabled>
          <button onclick="sendMessage()" id="send-btn" disabled>Send</button>
        </div>

        <div class="mini" style="margin-top: 10px;">
          Tip: connect → select agent → chat. Heartbeat is auto-handled.
        </div>
      </div>

      <div class="card">
        <div class="row space" style="margin-bottom: 10px;">
          <h3 style="color:#e2e8f0;">👥 Connected Clients</h3>
          <span class="mini">auto-refresh</span>
        </div>
        <div class="clients" id="clients"></div>
      </div>
    </div>

    <div class="card" style="margin-top: 14px;">
      <div class="row space" style="margin-bottom: 10px;">
        <h3 style="color:#22c55e;">📡 Event Log</h3>
        <button onclick="clearLog()" class="secondary">Clear Log</button>
      </div>
      <div id="log" class="log-container"></div>
    </div>
  </div>

  <script>
    let ws = null;
    let currentAgentId = null;
    let currentAgentName = null;
    let messageBuffer = '';
    let pollTimer = null;

    function nowTime() { return new Date().toLocaleTimeString(); }

    function log(message, type = 'system') {
      const container = document.getElementById('log');
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + type;
      entry.innerHTML = '<span class="timestamp">' + nowTime() + '</span> ' + message;
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
    }

    function clearLog() { document.getElementById('log').innerHTML = ''; }

    function updateStatus(status) {
      const el = document.getElementById('status');
      el.textContent = status;
      el.className = 'status ' + status.toLowerCase();
    }

    function updateUI(connected) {
      document.getElementById('connect-btn').disabled = connected;
      document.getElementById('disconnect-btn').disabled = !connected;
      document.getElementById('select-agent-btn').disabled = !connected;
      document.getElementById('message-input').disabled = !connected || !currentAgentId;
      document.getElementById('send-btn').disabled = !connected || !currentAgentId;
      document.getElementById('resume-btn').disabled = !connected || !loadSavedSession()?.sessionId;
      document.getElementById('clear-btn').disabled = !connected;
    }

    function setAgentBadge(name) {
      const badge = document.getElementById('agent-badge');
      if (!name) {
        badge.style.display = 'none';
        return;
      }
      badge.textContent = name;
      badge.style.display = 'inline-block';
    }

    function setSessionText(value) {
      document.getElementById('session-id').textContent = value || '-';
    }

    async function loadAgents() {
      try {
        const res = await fetch('/api/agents', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        const agents = json.data || json.agents || [];
        const select = document.getElementById('agent-select');
        select.innerHTML = '<option value="">Select Agent...</option>';
        agents.forEach((a) => {
          const opt = document.createElement('option');
          opt.value = a.id;
          opt.textContent = a.name + (a.type ? (' · ' + a.type) : '');
          select.appendChild(opt);
        });
        log('Agents loaded: ' + agents.length, 'system');
      } catch (e) {
        log('Failed to load agents: ' + e, 'error');
      }
    }

    function saveSession(sessionId) {
      const now = Date.now();
      const obj = {
        sessionId,
        agentId: currentAgentId || null,
        agentName: currentAgentName || null,
        createdAt: now,
        expiresAt: now + 48 * 60 * 60 * 1000,
      };
      localStorage.setItem('zc_ws_session_v2', JSON.stringify(obj));
      updateUI(!!ws);
    }

    function loadSavedSession() {
      try {
        const raw = localStorage.getItem('zc_ws_session_v2');
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj?.sessionId || !obj?.expiresAt) return null;
        if (Date.now() > obj.expiresAt) {
          localStorage.removeItem('zc_ws_session_v2');
          return null;
        }
        return obj;
      } catch {
        return null;
      }
    }

    function clearSavedSession() {
      localStorage.removeItem('zc_ws_session_v2');
      updateUI(!!ws);
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function renderClients(snapshot) {
      const container = document.getElementById('clients');
      const clients = snapshot?.data?.clients || snapshot?.clients || [];
      document.getElementById('client-count').textContent = String(clients.length || 0);
      if (!clients.length) {
        container.innerHTML = '<div class="client-row"><div class="mini">No active clients</div><div></div><div></div></div>';
        return;
      }
      container.innerHTML = '';
      clients.forEach((c) => {
        const row = document.createElement('div');
        row.className = 'client-row';
        const kind = c.kind || 'unknown';
        const tagClass = kind === 'editor' ? 'tag warn' : (kind === 'browser' ? 'tag ok' : 'tag');
        row.innerHTML =
          '<div><span class=\"' + tagClass + '\">' + escapeHtml(kind) + '</span> ' +
          (c.name ? ('<b style=\"margin-left:8px\">' + escapeHtml(c.name) + '</b>') : '') +
          '<div class=\"mini\"><code>' + escapeHtml(String(c.clientId || '').slice(0, 12)) + '</code>' +
          (c.agentId ? (' · agent <code>' + escapeHtml(String(c.agentId).slice(0, 10)) + '</code>') : ' · no agent') +
          '</div></div>' +
          '<div><div class=\"mini\">session</div><code>' + escapeHtml(String(c.sessionId || '').slice(0, 16)) + '</code></div>' +
          '<div><div class=\"mini\">activity</div><code>' + escapeHtml(String(c.lastActivityAt || '').split('T')[1]?.replace('Z','') || '-') + '</code></div>';
        container.appendChild(row);
      });
    }

    async function refreshClients() {
      try {
        const res = await fetch('/clients', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        renderClients(json);
      } catch {
        // ignore
      }
    }

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = protocol + '//' + window.location.host + '/ws';
      updateStatus('Connecting');
      log('Connecting to ' + wsUrl, 'system');

      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        updateStatus('Connected');
        log('WebSocket connected', 'system');
        ws.send(JSON.stringify({ type: 'client.register', kind: 'browser', name: 'Browser Test UI' }));
        updateUI(true);
        loadAgents();
        refreshClients();
        pollTimer = setInterval(refreshClients, 2000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const pretty = JSON.stringify(data, null, 2);

          if (data.event === 'heartbeat.ping') {
            ws.send(JSON.stringify({ type: 'heartbeat.pong', timestamp: new Date().toISOString() }));
            log('heartbeat.pong sent (auto)', 'out');
          }

          if (data.event === 'session.init') {
            setSessionText(data.sessionId || data.payload?.sessionId || '-');
          }

          if (data.event === 'session.update' || data.event === 'session.resumed') {
            const sid = data.payload?.sessionId || data.sessionId;
            if (sid) {
              setSessionText(sid);
              saveSession(sid);
            }
          }

          if (data.event === 'session.cleared') {
            setSessionText(data.payload?.sessionId || data.sessionId || '-');
            clearSavedSession();
            currentAgentId = null;
            currentAgentName = null;
            setAgentBadge(null);
            updateUI(true);
          }

          if (data.event === 'agent.selected') {
            currentAgentId = data.payload?.agentId || currentAgentId;
            currentAgentName = data.payload?.agentName || currentAgentName;
            setAgentBadge(currentAgentName);
            updateUI(true);
          }

          if (data.event === 'clients.update') {
            renderClients({ data: data.payload, clients: data.payload?.clients });
          }

          if (data.event === 'message.chunk') {
            messageBuffer += data.payload?.content || '';
          }

          if (data.event === 'message.end') {
            log('Response complete: ' + escapeHtml(messageBuffer.slice(0, 160)) + (messageBuffer.length > 160 ? '…' : ''), 'in');
            messageBuffer = '';
          }

          log('← ' + escapeHtml(data.event) + '\\n<pre style=\"white-space:pre-wrap;opacity:0.85\">' + escapeHtml(pretty) + '</pre>', 'in');
        } catch (e) {
          log('← ' + escapeHtml(event.data), 'in');
        }
      };

      ws.onerror = (error) => {
        log('Error: ' + error, 'error');
      };

      ws.onclose = () => {
        updateStatus('Disconnected');
        log('WebSocket closed', 'system');
        updateUI(false);
        ws = null;
        currentAgentId = null;
        currentAgentName = null;
        setAgentBadge(null);
        setSessionText('-');
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
      };
    }

    function disconnect() {
      if (ws) ws.close();
    }

    function selectAgent() {
      const agentId = document.getElementById('agent-select').value;
      if (!agentId) {
        log('Please select an agent first', 'error');
        return;
      }
      currentAgentId = agentId;
      const msg = { type: 'agent.select', agentId };
      ws.send(JSON.stringify(msg));
      log('→ agent.select\\n<pre style=\"white-space:pre-wrap\">' + escapeHtml(JSON.stringify(msg, null, 2)) + '</pre>', 'out');
    }

    function resumeSavedSession() {
      const saved = loadSavedSession();
      if (!saved?.sessionId || !ws) return;
      const msg = { type: 'session.resume', sessionId: saved.sessionId };
      ws.send(JSON.stringify(msg));
      log('→ session.resume\\n<pre style=\"white-space:pre-wrap\">' + escapeHtml(JSON.stringify(msg, null, 2)) + '</pre>', 'out');
    }

    function clearSession() {
      if (!ws) return;
      ws.send(JSON.stringify({ type: 'session.clear' }));
      clearSavedSession();
      currentAgentId = null;
      currentAgentName = null;
      setAgentBadge(null);
      updateUI(true);
      log('→ session.clear', 'out');
    }

    function sendMessage() {
      const input = document.getElementById('message-input');
      const content = input.value.trim();
      if (!content || !ws) return;
      const msg = { type: 'chat.start', agentId: currentAgentId, messages: [{ role: 'user', content }], stream: true };
      ws.send(JSON.stringify(msg));
      log('→ chat.start\\n<pre style=\"white-space:pre-wrap\">' + escapeHtml(JSON.stringify(msg, null, 2)) + '</pre>', 'out');
      input.value = '';
    }

    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    (function bootstrap() {
      const saved = loadSavedSession();
      if (saved?.sessionId) {
        log('Saved session available (48h): ' + escapeHtml(saved.sessionId), 'system');
      }
      refreshClients();
      loadAgents();
    })();
  </script>
</body>
</html>`;
}

function getMcpAuditPage(): string {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZombieCoder - Session/Auth/Tool Audit (WS + MCP)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
      background: radial-gradient(1200px 600px at 20% -10%, rgba(34,197,94,0.18), transparent 60%),
                  radial-gradient(900px 500px at 90% 0%, rgba(59,130,246,0.18), transparent 55%),
                  linear-gradient(135deg, #070a12 0%, #111827 100%);
      color: #e5e7eb;
      padding: 28px 18px;
      min-height: 100vh;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 {
      background: linear-gradient(90deg, #22c55e, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .subtitle { color: #94a3b8; margin-bottom: 18px; line-height: 1.45; }
    a { color: #93c5fd; text-decoration: none; }
    a:hover { text-decoration: underline; }

    .grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 14px; }
    @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }

    .card {
      background: rgba(2, 6, 23, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      backdrop-filter: blur(10px);
    }

    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row.space { justify-content: space-between; }

    .status {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 800;
    }
    .status.connected { background: #22c55e; color: white; }
    .status.disconnected { background: #ef4444; color: white; }
    .status.connecting { background: #f59e0b; color: white; }

    button {
      padding: 10px 12px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-weight: 900;
      transition: opacity 0.15s;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      color: #eafff1;
    }
    button:hover { opacity: 0.92; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.22);
      color: #cbd5e1;
    }

    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
    }
    pre {
      background: rgba(2,6,23,0.85);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 12px;
      padding: 12px;
      overflow: auto;
      line-height: 1.35;
      margin-top: 10px;
      white-space: pre;
    }
    .log {
      background: rgba(2,6,23,0.85);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 12px;
      padding: 12px;
      height: 420px;
      overflow: auto;
      line-height: 1.35;
    }
    .log .line { margin-bottom: 8px; padding: 8px; border-radius: 8px; }
    .log .in { background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; }
    .log .out { background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; }
    .log .sys { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; }
    .ts { color: #64748b; font-size: 11px; }
    .mini { font-size: 12px; color: #94a3b8; }
    .kbd { border: 1px solid rgba(148,163,184,0.25); background: rgba(148,163,184,0.10); padding: 2px 6px; border-radius: 8px; font-weight: 900; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Session/Auth/Heartbeat/Tool-Audit — বাস্তব জীবনের ম্যাপ</h1>
    <p class="subtitle">
      এই পেইজটা তোমার “স্বরাষ্ট্রমন্ত্রী (Editor) বনাম সার্ভার (Totka Sahon) লাইনে দাঁড়ানো” গল্পটা টেকনিক্যাল স্টেট-মেশিনে নামায়।
      <br>
      এখানে দুইটা পাইপ একসাথে চিন্তা করো:
      <br>
      <span class="kbd">WS</span> = দীর্ঘস্থায়ী সংযোগ (heartbeat + events + audit) · <span class="kbd">HTTP/SSE MCP</span> = editor-config → capability discover → tools/call
      <br>
      Back: <a href="/test">/test</a>
    </p>

    <div class="grid">
      <div class="card">
        <div class="row space" style="margin-bottom: 12px;">
          <div>
            <span id="status" class="status disconnected">Disconnected</span>
            <span class="mini" style="margin-left: 10px;">WS endpoint: <code id="ws-url">-</code></span>
          </div>
          <div class="row">
            <button id="connect" onclick="connect()">Connect WS</button>
            <button id="disconnect" class="secondary" onclick="disconnect()" disabled>Disconnect</button>
          </div>
        </div>

        <div class="row" style="margin-bottom: 10px;">
          <button id="btn-register" class="secondary" onclick="registerEditor()" disabled>client.register (editor)</button>
          <button id="btn-heartbeat" class="secondary" onclick="sendPong()" disabled>heartbeat.pong</button>
          <button id="btn-agent" class="secondary" onclick="selectAgent()" disabled>agent.select (demo)</button>
        </div>

        <div class="mini">
          লক্ষ্য: Editor “কথা বলার ইচ্ছা” করলে আগে তাকে <b>সেশন + পরিচয় + অথ</b> লাগবে। WS-এ সেটা live থাকে, HTTP/SSE-এ সেটা request-scoped হলেও <b>sessionId + auth header</b> দিয়ে correlate করা যায়।
        </div>

        <pre id="flow">(loading flow...)</pre>
      </div>

      <div class="card">
        <div class="row space" style="margin-bottom: 10px;">
          <h3 style="color:#e2e8f0;">Live Audit Log (client-side)</h3>
          <span class="mini">incoming/outgoing</span>
        </div>
        <div id="log" class="log"></div>
      </div>
    </div>

    <div class="card" style="margin-top: 14px;">
      <h3 style="color:#e2e8f0; margin-bottom: 10px;">তোমার কথার exact mapping (practical)</h3>
      <pre>${String.raw`1) Editor (স্বরাষ্ট্রমন্ত্রী) “লাইনে দাঁড়ায়”
   - WS: connect → server দেয় (clientId, ephemeral sessionId) → heartbeat শুরু
   - HTTP/SSE MCP: config এ baseUrl দিলেই editor discover করবে → initialize/tools/list

2) Identity + Auth attach
   - WS: client.register(kind=editor,name=...) + (future) auth message
   - HTTP/SSE: Authorization: Bearer <token> বা X-API-Key: ...

3) Session creation (real DB session)
   - WS world: server calls Next.js /api/sessions → returns real sessionId → all events tagged
   - HTTP/SSE world: server can also mint/return sessionId during initialize (future enhancement)

4) Heartbeat (ping/pong) = “আমি বেঁচে আছি” proof
   - WS: ping → pong ACK না এলে server disconnect + audit
   - SSE: keep-alive comments (':keep-alive') + client reconnect strategy

5) Tool request
   - MCP: tools/list → tools/call(name,args)
   - Server must log: who (client), which session, which tool, inputs, duration, result

6) Admin view (Totka Sahon audit)
   - WS gateway logs + session ledger
   - MCP endpoint logs + correlation ids (sessionId/requestId)`}</pre>
      <div class="mini" style="margin-top: 10px;">
        তোমার “এডিটর ব্যস্ত—মন চাইলে টেস্ট করবে” সমস্যার practical fix হলো: server-side এ <b>observable contract</b> বানাও।
        মানে: connect হলে server নিজেই state emit করবে (capabilities + requirements), heartbeat enforce করবে, এবং tool-call audit লিখবে।
        তখন “মন চাইলে/না চাইলে” না—pipeline নিজেই প্রমাণ রেখে চলবে।
      </div>
    </div>
  </div>

  <script>
    const wsUrl = (() => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      return proto + '//' + location.host + '/ws';
    })();

    const logEl = document.getElementById('log');
    const statusEl = document.getElementById('status');
    const wsUrlEl = document.getElementById('ws-url');
    const flowEl = document.getElementById('flow');

    const btnConnect = document.getElementById('connect');
    const btnDisconnect = document.getElementById('disconnect');
    const btnRegister = document.getElementById('btn-register');
    const btnHeartbeat = document.getElementById('btn-heartbeat');
    const btnAgent = document.getElementById('btn-agent');

    wsUrlEl.textContent = wsUrl;

    let ws = null;
    let lastSessionId = null;
    let lastClientId = null;

    function setStatus(kind) {
      statusEl.className = 'status ' + kind;
      statusEl.textContent = kind === 'connected' ? 'Connected' : (kind === 'connecting' ? 'Connecting' : 'Disconnected');
    }

    function ts() {
      return new Date().toISOString();
    }

    function appendLog(dir, payload) {
      const div = document.createElement('div');
      div.className = 'line ' + (dir === 'in' ? 'in' : (dir === 'out' ? 'out' : 'sys'));
      const safe = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      div.innerHTML = '<div class="ts">' + ts() + '</div><pre style="margin-top:6px; white-space:pre-wrap;">' + safe.replace(/</g,'&lt;') + '</pre>';
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function renderFlow() {
      flowEl.textContent = [
        'WS pipeline (observed):',
        '  1) connect → server emits session.init',
        '  2) (optional) client.register → server tags client kind/name',
        '  3) agent.select → server can mint real session via Next.js API',
        '  4) heartbeat ping/pong keeps pipe alive',
        '  5) any action → server logs with {clientId, sessionId, agentId}',
        '',
        'MCP HTTP/SSE pipeline (conceptual):',
        '  1) initialize (auth headers attach here)',
        '  2) tools/list',
        '  3) tools/call(name,args)',
        '  4) audit: toolName + args + duration + result (correlate sessionId)',
        '',
        'Live vars:',
        '  clientId: ' + (lastClientId || '-'),
        '  sessionId: ' + (lastSessionId || '-'),
      ].join('\n');
    }

    function enableControls(enabled) {
      btnDisconnect.disabled = !enabled;
      btnRegister.disabled = !enabled;
      btnHeartbeat.disabled = !enabled;
      btnAgent.disabled = !enabled;
    }

    window.connect = function connect() {
      if (ws && ws.readyState === WebSocket.OPEN) return;
      setStatus('connecting');
      appendLog('sys', { msg: 'connecting', wsUrl });
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus('connected');
        enableControls(true);
        btnConnect.disabled = true;
        appendLog('sys', { msg: 'connected' });
      };

      ws.onmessage = (ev) => {
        let data = null;
        try { data = JSON.parse(ev.data); } catch { data = ev.data; }
        appendLog('in', data);
        if (data && typeof data === 'object') {
          if (data.event === 'session.init' && data.payload) {
            lastClientId = data.payload.clientId || lastClientId;
            lastSessionId = data.payload.sessionId || lastSessionId;
            renderFlow();
          }
          if (data.sessionId && typeof data.sessionId === 'string') {
            lastSessionId = data.sessionId;
            renderFlow();
          }
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        enableControls(false);
        btnConnect.disabled = false;
        appendLog('sys', { msg: 'disconnected' });
      };

      ws.onerror = () => {
        appendLog('sys', { msg: 'ws error' });
      };
    }

    window.disconnect = function disconnect() {
      if (!ws) return;
      try { ws.close(); } catch {}
    }

    function send(obj) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      appendLog('out', obj);
      ws.send(JSON.stringify(obj));
    }

    window.registerEditor = function registerEditor() {
      send({ type: 'client.register', kind: 'editor', name: 'Windsurf/Cursor (demo)' });
    }

    window.sendPong = function sendPong() {
      send({ type: 'heartbeat.pong', timestamp: new Date().toISOString() });
    }

    window.selectAgent = function selectAgent() {
      send({ type: 'agent.select', agentId: 'demo-agent' });
    }

    renderFlow();
    enableControls(false);
  </script>
</body>
</html>`;
}

// ─── Startup ─────────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║          🧟 ZombieCoder WebSocket Server v2.0 (Experimental)                   ║
║                                                                              ║
║  Architecture: Agent-First | Gateway-Mediated | Standard Events              ║
║                                                                              ║
║  Features:                                                                   ║
║    ✓ Agent selection before chat                                             ║
║    ✓ Uses main app API (never direct provider)                             ║
║    ✓ Unified session management                                              ║
║    ✓ Standard event format (v2.0)                                            ║
║    ✓ Heartbeat with ACK (ping-pong)                                          ║
║    ✓ Clean identity (ZombieCoder-by-SahonSrabon)                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log(`🚀 Server running on ws://localhost:${SERVER_PORT}`);
console.log(`🧪 Test page: http://localhost:${SERVER_PORT}/test`);
console.log(`💚 Health check: http://localhost:${SERVER_PORT}/health`);
console.log(`🔗 Connected to: ${NEXTJS_BASE_URL}`);
console.log(`\nPress Ctrl+C to stop\n`);
