import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/services/mcpService';
import type { ApiResponse } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace = searchParams.get('workspace') ?? undefined;

    const config = await mcpService.getEditorConfig(workspace);

    return NextResponse.json<ApiResponse>(
      { success: true, data: config, timestamp: new Date().toISOString() },
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
