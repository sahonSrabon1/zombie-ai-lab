import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';
import type { AgentConfig } from '@/types';

const headers = { 'X-Powered-By': getIdentityHeader() };

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true, type: true, model: true, endpoint: true } },
        memories: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { chatSessions: true, toolAssignments: true } },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      { success: true, data: agent, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as Partial<AgentConfig>;

    // Verify agent exists
    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    const agent = await db.agent.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        status: body.status,
        personaName: body.personaName,
        systemPrompt: body.systemPrompt,
        description: body.description,
        config: body.config ? JSON.stringify(body.config) : undefined,
        providerId: body.providerId,
      },
    });

    return NextResponse.json(
      { success: true, data: agent, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update agent',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.agent.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { deleted: true }, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete agent',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
