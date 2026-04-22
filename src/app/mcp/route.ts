import { NextRequest } from 'next/server';

import { mcpService } from '@/services/mcpService';

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: '2.0';
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function clientWantsSse(request: NextRequest): boolean {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/event-stream');
}

function getExpectedBearerToken(): string | null {
  return process.env.MCP_BEARER_TOKEN ?? process.env.UAS_API_KEY ?? null;
}

function getBearerTokenFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function isAuthorized(request: NextRequest): boolean {
  const expected = getExpectedBearerToken();
  if (!expected) return true;
  const provided = getBearerTokenFromRequest(request);
  return Boolean(provided && provided === expected);
}

function sseEncodeEvent(event: { id?: string; event?: string; data?: string; retry?: number }): string {
  let out = '';
  if (event.retry !== undefined) out += `retry: ${event.retry}\n`;
  if (event.id !== undefined) out += `id: ${event.id}\n`;
  if (event.event !== undefined) out += `event: ${event.event}\n`;
  out += `data: ${event.data ?? ''}\n\n`;
  return out;
}

type McpSseSession = {
  createdAt: number;
  send: (payload: unknown) => boolean;
  close: () => void;
  keepAliveIntervalId?: ReturnType<typeof setInterval>;
};

const mcpSseSessions: Map<string, McpSseSession> =
  ((globalThis as unknown as { __zombiecoder_mcp_sse_sessions?: Map<string, McpSseSession> }).__zombiecoder_mcp_sse_sessions ??=
    new Map<string, McpSseSession>());

function createSseSessionStream(request: NextRequest, sessionId: string): Response {
  const encoder = new TextEncoder();
  const origin = new URL(request.url).origin;
  let closed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      const existing = mcpSseSessions.get(sessionId);
      if (existing) {
        existing.close();
      }

      const send = (payload: unknown) => {
        if (closed || !controllerRef) return false;
        try {
          controllerRef.enqueue(
            encoder.encode(
              sseEncodeEvent({
                event: 'message',
                data: typeof payload === 'string' ? payload : JSON.stringify(payload),
              }),
            ),
          );
          return true;
        } catch {
          return false;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controllerRef?.close();
        } catch {}
      };

      const keepAliveIntervalId = setInterval(() => {
        if (closed || !controllerRef) return;
        try {
          controllerRef.enqueue(encoder.encode(':keep-alive\n\n'));
        } catch {}
      }, 25_000);

      mcpSseSessions.set(sessionId, {
        createdAt: Date.now(),
        send,
        close,
        keepAliveIntervalId,
      });

      controller.enqueue(encoder.encode(sseEncodeEvent({ id: '0', data: '' })));
      controller.enqueue(encoder.encode(sseEncodeEvent({ retry: 1000, data: '' })));
      controller.enqueue(
        encoder.encode(
          sseEncodeEvent({
            id: '1',
            event: 'endpoint',
            data: JSON.stringify({
              sessionId,
              url: `${origin}/mcp/message?sessionId=${encodeURIComponent(sessionId)}`,
            }),
          }),
        ),
      );
    },
    cancel() {
      const existing = mcpSseSessions.get(sessionId);
      if (existing?.keepAliveIntervalId) clearInterval(existing.keepAliveIntervalId);
      mcpSseSessions.delete(sessionId);
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'x-mcp-session-id': sessionId,
    },
  });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (clientWantsSse(request)) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') || crypto.randomUUID();
    return createSseSessionStream(request, sessionId);
  }

  return new Response('MCP endpoint is available. Use POST with JSON-RPC 2.0 (methods: initialize, tools/list, tools/call).', {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json(jsonRpcError(null, -32001, 'Unauthorized'));
  }

  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return Response.json(jsonRpcError(null, -32700, 'Parse error'));
  }

  const id: JsonRpcId = body.id ?? null;
  const method = body.method;

  if (!method) {
    return Response.json(jsonRpcError(id, -32600, 'Invalid Request: missing method'));
  }

  try {
    const wantsSse = clientWantsSse(request);
    const streamId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const respond = (resultOrError: unknown) => {
      if (!wantsSse) return Response.json(resultOrError);

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode(sseEncodeEvent({ id: '0', data: '' })));
          controller.enqueue(enc.encode(sseEncodeEvent({ retry: 1000, data: '' })));
          controller.enqueue(
            enc.encode(
              sseEncodeEvent({
                id: '1',
                event: 'message',
                data: JSON.stringify(resultOrError),
              }),
            ),
          );
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          'x-mcp-stream-id': streamId,
        },
      });
    };

    if (method === 'initialize') {
      await mcpService.seedBuiltinTools();
      return respond(
        jsonRpcResult(id, {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'ZombieCoder-Agentic-Hub',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
            logging: {},
          },
        }),
      );
    }

    if (method === 'ping') {
      return respond(jsonRpcResult(id, {}));
    }

    if (method === 'resources/list') {
      return respond(jsonRpcResult(id, { resources: [] }));
    }

    if (method === 'prompts/list') {
      return respond(jsonRpcResult(id, { prompts: [] }));
    }

    if (method === 'logging/setLevel') {
      return respond(jsonRpcResult(id, {}));
    }

    if (method === 'tools/list') {
      await mcpService.seedBuiltinTools();
      const tools = await mcpService.listTools({ enabledOnly: true });
      return respond(
        jsonRpcResult(id, {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: (() => {
              try {
                return JSON.parse(t.inputSchema);
              } catch {
                return { type: 'object', properties: {} };
              }
            })(),
          })),
        }),
      );
    }

    if (method === 'tools/call') {
      await mcpService.seedBuiltinTools();
      const params = (body.params ?? {}) as { name?: string; arguments?: unknown; agentId?: string; sessionId?: string };
      const toolName = params.name;
      if (!toolName) {
        return respond(jsonRpcError(id, -32602, 'Invalid params: missing tool name'));
      }

      const exec = await mcpService.executeTool({
        toolName,
        input: (params.arguments ?? {}) as Record<string, unknown>,
        agentId: params.agentId,
        sessionId: params.sessionId,
      });

      if (!exec.success) {
        return respond(
          jsonRpcResult(id, {
            content: [{ type: 'text', text: exec.error ?? 'Tool execution failed' }],
            isError: true,
          }),
        );
      }

      return respond(
        jsonRpcResult(id, {
          content: [{ type: 'text', text: exec.output ?? '' }],
          isError: false,
        }),
      );
    }

    return respond(jsonRpcError(id, -32601, `Method not found: ${method}`));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(jsonRpcError(id, -32603, 'Internal error', { message }));
  }
}
