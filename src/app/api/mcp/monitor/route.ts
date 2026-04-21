import { NextResponse } from 'next/server';

import { probeMcpServer } from '@/services/mcpClientMonitor';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const baseUrl = process.env.MCP_PUBLIC_URL ?? 'http://localhost:3000';
    const url = `${baseUrl}/mcp`;

    const result = await probeMcpServer(url);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        url,
        tools: result.tools,
        resources: result.resources,
        latencyMs: result.ms,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
