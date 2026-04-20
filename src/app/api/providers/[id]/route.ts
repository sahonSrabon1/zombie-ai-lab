import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerGateway } from '@/services/providerGateway';
import { getIdentityHeader } from '@/lib/identity';
import type { ProviderConfig } from '@/types';

const headers = { 'X-Powered-By': getIdentityHeader() };

function isValidEnvVarName(value: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(value);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const provider = await db.aiProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: provider,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get provider', timestamp: new Date().toISOString() },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as Partial<ProviderConfig>;

    // Verify provider exists
    const existing = await db.aiProvider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Provider not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.endpoint !== undefined) updateData.endpoint = body.endpoint;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.apiKeyEnvVar !== undefined) {
      if (body.apiKeyEnvVar && !isValidEnvVarName(body.apiKeyEnvVar)) {
        return NextResponse.json(
          {
            success: false,
            error: `apiKeyEnvVar must be an environment variable name (e.g. GEMINI_API_KEY). It looks like you entered an API key value: "${body.apiKeyEnvVar}"`,
            timestamp: new Date().toISOString(),
          },
          { status: 400, headers }
        );
      }
      updateData.apiKeyEnvVar = body.apiKeyEnvVar;
    }

    // Merge config
    if (body.temperature !== undefined || body.maxTokens !== undefined || body.timeoutMs !== undefined) {
      const currentConfig = JSON.parse(existing.config) as Record<string, unknown>;
      if (body.temperature !== undefined) currentConfig.temperature = body.temperature;
      if (body.maxTokens !== undefined) currentConfig.maxTokens = body.maxTokens;
      if (body.timeoutMs !== undefined) currentConfig.timeoutMs = body.timeoutMs;
      updateData.config = JSON.stringify(currentConfig);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const provider = await db.aiProvider.update({
      where: { id },
      data: updateData,
    });

    // Invalidate provider gateway cache so changes take effect
    providerGateway.dispose();

    return NextResponse.json(
      { success: true, data: provider, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update provider', timestamp: new Date().toISOString() },
      { status: 500, headers }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await providerGateway.deleteProvider(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Provider not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true }, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete provider',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
