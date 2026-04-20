import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, content, model, provider, tokenCount, latencyMs, metadata } = body;

    if (!role || !content) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: role, content', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const validRoles = ['system', 'user', 'assistant', 'tool'];
    if (!validRoles.includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const message = await memoryService.addMessage(id, {
      role,
      content,
      model,
      provider,
      tokenCount,
      latencyMs,
      metadata,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: message, timestamp: new Date().toISOString() },
      { status: 201, headers: { 'X-Powered-By': POWERED_BY } },
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
