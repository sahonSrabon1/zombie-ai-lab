import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);

    const sinceMs = Number(url.searchParams.get('sinceMs') ?? 60 * 60 * 1000);
    const since = new Date(Date.now() - Math.min(Math.max(sinceMs, 10_000), 7 * 24 * 60 * 60 * 1000));

    const [connections, wsLogs, toolLogs] = await Promise.all([
      db.editorClientConnection.findMany({
        where: { OR: [{ updatedAt: { gte: since } }, { connectedAt: { gte: since } }] },
        orderBy: { updatedAt: 'desc' },
        take: 200,
        include: {
          bindings: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { chatSession: { select: { id: true, agentId: true, title: true, status: true, createdAt: true } } },
          },
        },
      }),
      db.editorWsRequestLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.toolExecutionLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { tool: { select: { name: true, category: true, requiredAuth: true } } },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          since: since.toISOString(),
          connections,
          wsLogs,
          toolLogs,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Admin audit fetch failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
