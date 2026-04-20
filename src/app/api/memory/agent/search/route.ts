import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, query, limit, topic } = body;

    if (!agentId || !query) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: agentId, query', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const memories = await memoryService.searchAgentMemories(agentId, query, {
      limit,
      topic,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: { memories, count: memories.length }, timestamp: new Date().toISOString() },
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
