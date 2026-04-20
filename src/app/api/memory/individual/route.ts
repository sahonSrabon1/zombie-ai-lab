import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse, MemoryEntry } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const type = searchParams.get('type') ?? undefined;

    const { memories, total } = await memoryService.getIndividualMemories({
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
    });

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
    const { content, memoryType, importance, metadata } = body;

    if (!content) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required field: content', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const memory = await memoryService.addIndividualMemory({
      content,
      memoryType,
      importance,
      metadata,
    } as MemoryEntry & { memoryType?: string });

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
