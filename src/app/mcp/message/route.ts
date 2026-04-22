import { NextRequest } from 'next/server';

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: '2.0';
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id, error: { code, message, data } } as JsonRpcResponse;
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

function getSessions(): Map<string, { send: (payload: unknown) => boolean }> {
  const g = globalThis as unknown as {
    __zombiecoder_mcp_sse_sessions?: Map<string, { send: (payload: unknown) => boolean }>;
  };
  return g.__zombiecoder_mcp_sse_sessions ?? new Map();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json(jsonRpcError(null, -32001, 'Unauthorized'));
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = (await request.json()) as unknown;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const session = getSessions().get(sessionId) ?? null;

  if (!session) {
    return Response.json({ error: 'Unknown sessionId' }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const mcpUrl = new URL('/mcp', origin);

  const requests = Array.isArray(payload) ? payload : [payload];
  for (const item of requests) {
    const res = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: request.headers.get('authorization') ?? '',
      },
      body: JSON.stringify(item),
    });
    const text = await res.text();
    let out: unknown = text;
    try {
      out = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      // ignore
    }
    session.send(out);
  }

  return new Response(null, { status: 202 });
}
