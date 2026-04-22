import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const target = new URL('/mcp', url.origin);
  target.search = url.search;

  const authorization = request.headers.get('authorization');

  const res = await fetch(target, {
    method: 'GET',
    headers: {
      accept: request.headers.get('accept') ?? 'text/event-stream',
      ...(authorization ? { authorization } : {}),
    },
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const target = new URL('/mcp', url.origin);
  target.search = url.search;

  const authorization = request.headers.get('authorization');

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') ?? 'application/json',
      accept: request.headers.get('accept') ?? 'application/json, text/event-stream',
      ...(authorization ? { authorization } : {}),
    },
    body: await request.text(),
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
