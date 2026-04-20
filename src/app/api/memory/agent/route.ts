import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const limit = searchParams.get('limit');
    const topic = searchParams.get('topic') ?? undefined;

    // If agentId is provided, filter by agent
    if (agentId) {
      const { memories, total } = await memoryService.getAgentMemories(agentId, {
        limit: limit ? parseInt(limit, 10) : undefined,
        topic,
      });

      return NextResponse.json<ApiResponse>(
        { success: true, data: { memories, total }, timestamp: new Date().toISOString() },
        { status: 200, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    // No agentId — list all agent memories
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 200) : 50;
    const where: Record<string, unknown> = {};
    if (topic) where.topic = topic;

    const [memories, total] = await Promise.all([
      db.agentMemory.findMany({
        where,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      db.agentMemory.count({ where }),
    ]);

    return NextResponse.json<ApiResponse>(
      { success: true, data: { memories, total }, timestamp: new Date().toISOString() },
      { status: 200, headers: { 'X-Powered-By': POWERED_BY } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500, headers: { 'X-Powered-By': POWERED_BY } },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, content, topic, priority, importance, metadata } = body;

    if (!agentId || !content) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: agentId, content', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const memory = await memoryService.addAgentMemory(agentId, {
      content,
      topic,
      priority,
      importance,
      metadata,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: memory, timestamp: new Date().toISOString() },
      { status: 201, headers: { 'X-Powered-By': POWERED_BY } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500, headers: { 'X-Powered-By': POWERED_BY } },
    );
  }
}
