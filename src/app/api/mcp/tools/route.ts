import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/services/mcpService';
import type { ApiResponse, ToolDefinition } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(request: NextRequest) {
  try {
    // Auto-seed built-in tools on first access
    await mcpService.seedBuiltinTools();

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const tools = await mcpService.listTools({
      agentId,
      category,
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: { tools, count: tools.length }, timestamp: new Date().toISOString() },
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
    const body = await request.json() as ToolDefinition;
    const { name, description, inputSchema } = body;

    if (!name || !description || !inputSchema) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: name, description, inputSchema', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    const tool = await mcpService.registerTool(body);

    return NextResponse.json<ApiResponse>(
      { success: true, data: tool, timestamp: new Date().toISOString() },
      { status: 201, headers: { 'X-Powered-By': POWERED_BY } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json<ApiResponse>(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status, headers: { 'X-Powered-By': POWERED_BY } },
    );
  }
}
