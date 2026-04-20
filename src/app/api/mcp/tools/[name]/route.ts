import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/services/mcpService';
import type { ApiResponse, ToolDefinition } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const tool = await mcpService.getTool(name);

    if (!tool) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Tool '${name}' not found`, timestamp: new Date().toISOString() },
        { status: 404, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: tool, timestamp: new Date().toISOString() },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const body = await request.json() as Partial<ToolDefinition>;

    const tool = await mcpService.updateTool(name, body);

    return NextResponse.json<ApiResponse>(
      { success: true, data: tool, timestamp: new Date().toISOString() },
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
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const deleted = await mcpService.deleteTool(name);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Tool '${name}' not found`, timestamp: new Date().toISOString() },
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
