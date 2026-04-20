import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse, MemoryEntry } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<MemoryEntry> = {};

    if (body.content !== undefined) updates.content = body.content;
    if (body.topic !== undefined) updates.topic = body.topic;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.importance !== undefined) updates.importance = body.importance;
    if (body.sessionId !== undefined) updates.sessionId = body.sessionId;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid fields provided for update', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const memory = await memoryService.updateAgentMemory(id, updates);

    return NextResponse.json<ApiResponse>(
      { success: true, data: memory, timestamp: new Date().toISOString() },
      { status: 200, headers: { 'X-Powered-By': POWERED_BY } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') || message.includes('No record') ? 404 : 500;
    return NextResponse.json<ApiResponse>(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status, headers: { 'X-Powered-By': POWERED_BY } },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await memoryService.deleteAgentMemory(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Memory not found', timestamp: new Date().toISOString() },
        { status: 404, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: { deleted: true }, timestamp: new Date().toISOString() },
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
