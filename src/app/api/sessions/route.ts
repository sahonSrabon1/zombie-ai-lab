import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const status = searchParams.get('status') ?? undefined;

    const { sessions, total } = await memoryService.listSessions({
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: { sessions, total }, timestamp: new Date().toISOString() },
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
    const { agentId, providerId, title } = body;

    const session = await memoryService.createSession({
      agentId,
      providerId,
      title,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: session, timestamp: new Date().toISOString() },
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
