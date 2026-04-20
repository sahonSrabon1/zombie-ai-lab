import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const connections = await db.editorClientConnection.findMany({
      where: {
        OR: [{ updatedAt: { gte: since } }, { connectedAt: { gte: since } }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        bindings: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            chatSession: { select: { id: true, agentId: true, title: true, status: true, createdAt: true } },
          },
        },
        wsLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      take: 200,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          since: since.toISOString(),
          count: connections.length,
          connections,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list editor connections',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
