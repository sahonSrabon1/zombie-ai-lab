import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/services/memoryService';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await memoryService.getSession(id);

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session not found', timestamp: new Date().toISOString() },
        { status: 404, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: session, timestamp: new Date().toISOString() },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await memoryService.deleteSession(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session not found', timestamp: new Date().toISOString() },
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
