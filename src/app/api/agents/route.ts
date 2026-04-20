import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';
import type { AgentConfig, AgentType, AgentStatus } from '@/types';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { id: true, name: true, type: true } },
        _count: { select: { memories: true, chatSessions: true, toolAssignments: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: agents, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list agents',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<AgentConfig>;

    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: 'name and type are required', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const validTypes: AgentType[] = ['chatbot', 'assistant', 'coder', 'researcher', 'custom'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${validTypes.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const agent = await db.agent.create({
      data: {
        name: body.name,
        type: body.type,
        status: (body.status || 'active') as AgentStatus,
        personaName: body.personaName || null,
        systemPrompt: body.systemPrompt || null,
        description: body.description || null,
        config: JSON.stringify(body.config || {}),
        providerId: body.providerId || null,
      },
    });

    return NextResponse.json(
      { success: true, data: agent, timestamp: new Date().toISOString() },
      { status: 201, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create agent',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
