import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

type StockEvent =
  | {
      type: 'client_connected';
      clientId: string;
      sessionId: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      connectedAt?: string;
    }
  | {
      type: 'client_ping';
      clientId: string;
      sessionId: string;
      pingAt?: string;
    }
  | {
      type: 'client_disconnected';
      clientId: string;
      sessionId: string;
      disconnectedAt?: string;
      reason?: string | null;
    }
  | {
      type: 'ws_request_log';
      clientId: string;
      sessionId?: string | null;
      requestId?: string | null;
      messageType?: string | null;
      providerType?: string | null;
      model?: string | null;
      latencyMs?: number | null;
      status?: 'success' | 'error';
      errorMessage?: string | null;
      metadata?: Record<string, unknown> | null;
      createdAt?: string;
    }
  | {
      type: 'bind_chat_session';
      clientId: string;
      chatSessionId: string;
    };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StockEvent;

    if (!body || typeof (body as any).type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid event payload', timestamp: new Date().toISOString() },
        { status: 400, headers },
      );
    }

    if (body.type === 'client_connected') {
      await db.editorClientConnection.upsert({
        where: { clientId: body.clientId },
        create: {
          clientId: body.clientId,
          sessionId: body.sessionId,
          connectedAt: body.connectedAt ? new Date(body.connectedAt) : new Date(),
          lastPingAt: new Date(),
          ipAddress: body.ipAddress ?? null,
          userAgent: body.userAgent ?? null,
        },
        update: {
          sessionId: body.sessionId,
          disconnectedAt: null,
          lastPingAt: new Date(),
          ipAddress: body.ipAddress ?? null,
          userAgent: body.userAgent ?? null,
        },
      });

      return NextResponse.json(
        { success: true, data: { stored: true }, timestamp: new Date().toISOString() },
        { status: 200, headers },
      );
    }

    if (body.type === 'client_ping') {
      const MIN_PING_WRITE_INTERVAL_MS = 15_000;
      const pingAt = body.pingAt ? new Date(body.pingAt) : new Date();

      const existing = await db.editorClientConnection.findUnique({
        where: { clientId: body.clientId },
        select: { sessionId: true, lastPingAt: true, disconnectedAt: true },
      });

      if (!existing) {
        await db.editorClientConnection.create({
          data: {
            clientId: body.clientId,
            sessionId: body.sessionId,
            lastPingAt: pingAt,
          },
        });
      } else {
        const lastPingAtMs = existing.lastPingAt ? existing.lastPingAt.getTime() : 0;
        const shouldWrite =
          existing.sessionId !== body.sessionId ||
          !!existing.disconnectedAt ||
          pingAt.getTime() - lastPingAtMs >= MIN_PING_WRITE_INTERVAL_MS;

        if (shouldWrite) {
          await db.editorClientConnection.update({
            where: { clientId: body.clientId },
            data: {
              sessionId: body.sessionId,
              lastPingAt: pingAt,
              disconnectedAt: null,
            },
          });
        }
      }

      return NextResponse.json(
        { success: true, data: { stored: true }, timestamp: new Date().toISOString() },
        { status: 200, headers },
      );
    }

    if (body.type === 'client_disconnected') {
      await db.editorClientConnection.updateMany({
        where: { clientId: body.clientId },
        data: {
          disconnectedAt: body.disconnectedAt ? new Date(body.disconnectedAt) : new Date(),
        },
      });

      return NextResponse.json(
        { success: true, data: { stored: true }, timestamp: new Date().toISOString() },
        { status: 200, headers },
      );
    }

    if (body.type === 'ws_request_log') {
      await db.editorClientConnection.upsert({
        where: { clientId: body.clientId },
        create: {
          clientId: body.clientId,
          sessionId: body.sessionId ?? 'unknown',
          lastPingAt: new Date(),
        },
        update: {
          sessionId: body.sessionId ?? undefined,
          lastPingAt: new Date(),
        },
      });

      await db.editorWsRequestLog.create({
        data: {
          requestId: body.requestId ?? null,
          clientId: body.clientId,
          editorSessionId: body.sessionId ?? null,
          messageType: body.messageType ?? null,
          providerType: body.providerType ?? null,
          model: body.model ?? null,
          latencyMs: body.latencyMs ?? null,
          status: body.status ?? 'success',
          errorMessage: body.errorMessage ?? null,
          metadata: JSON.stringify(body.metadata ?? {}),
          createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
        },
      });

      return NextResponse.json(
        { success: true, data: { stored: true }, timestamp: new Date().toISOString() },
        { status: 200, headers },
      );
    }

    if (body.type === 'bind_chat_session') {
      await db.editorSessionBinding.create({
        data: {
          clientId: body.clientId,
          chatSessionId: body.chatSessionId,
        },
      });

      return NextResponse.json(
        { success: true, data: { stored: true }, timestamp: new Date().toISOString() },
        { status: 200, headers },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported event type', timestamp: new Date().toISOString() },
      { status: 400, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Stock event ingest failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
