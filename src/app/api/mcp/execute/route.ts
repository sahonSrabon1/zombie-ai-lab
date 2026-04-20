import { NextRequest, NextResponse } from 'next/server';
import { mcpService } from '@/services/mcpService';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, ToolExecutionRequest } from '@/types';

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';
const logger = createLogger('api:mcp:execute');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ToolExecutionRequest;
    const { toolName, input } = body;

    if (!toolName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required field: toolName', timestamp: new Date().toISOString() },
        { status: 400, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    // Check if tool requires auth — look it up first
    const tool = await mcpService.getTool(toolName);

    if (!tool) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Tool '${toolName}' not found`, timestamp: new Date().toISOString() },
        { status: 404, headers: { 'X-Powered-By': POWERED_BY } },
      );
    }

    // If tool requires auth, validate API key
    if (tool.requiredAuth) {
      const providedKey = request.headers.get('X-API-Key');
      const envKey = process.env.UAS_API_KEY;

      if (!envKey) {
        logger.warn('Tool requires auth but UAS_API_KEY is not configured', { toolName });
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Server is not configured for authenticated requests (UAS_API_KEY not set)', timestamp: new Date().toISOString() },
          { status: 503, headers: { 'X-Powered-By': POWERED_BY } },
        );
      }

      if (!providedKey || providedKey !== envKey) {
        logger.warn('Invalid or missing API key for authenticated tool', { toolName });
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid or missing API key. Provide X-API-Key header.', timestamp: new Date().toISOString() },
          { status: 401, headers: { 'X-Powered-By': POWERED_BY } },
        );
      }
    }

    const result = await mcpService.executeTool(body);

    const status = result.success ? 200 : 422;
    return NextResponse.json<ApiResponse>(
      { success: result.success, data: result, timestamp: new Date().toISOString() },
      { status, headers: { 'X-Powered-By': POWERED_BY } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500, headers: { 'X-Powered-By': POWERED_BY } },
    );
  }
}
