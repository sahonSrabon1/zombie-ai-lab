import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerGateway } from '@/services/providerGateway';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId') ?? undefined;

    if (providerId) {
      const provider = await db.aiProvider.findUnique({ where: { id: providerId } });
      if (!provider) {
        return NextResponse.json(
          { success: false, error: 'Provider not found', timestamp: new Date().toISOString() },
          { status: 404, headers }
        );
      }

      const runtime = await providerGateway.listRuntimeModels(providerId);
      const usage = await providerGateway.getProviderUsage(providerId);

      return NextResponse.json(
        {
          success: true,
          data: {
            provider: {
              id: provider.id,
              name: provider.name,
              type: provider.type,
              endpoint: provider.endpoint,
              status: provider.status,
              isDefault: provider.isDefault,
              model: provider.model,
              latencyMs: provider.latencyMs,
              lastHealthCheck: provider.lastHealthCheck,
              errorCount: provider.errorCount,
              lastError: provider.lastError,
            },
            runtime,
            usage,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers }
      );
    }

    const providers = await db.aiProvider.findMany({ orderBy: { createdAt: 'desc' } });
    const usages = await Promise.all(
      providers.map(async (p) => ({ providerId: p.id, ...(await providerGateway.getProviderUsage(p.id)) }))
    );
    const usageById = new Map(usages.map((u) => [u.providerId, u]));

    return NextResponse.json(
      {
        success: true,
        data: providers.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          endpoint: p.endpoint,
          status: p.status,
          isDefault: p.isDefault,
          model: p.model,
          latencyMs: p.latencyMs,
          lastHealthCheck: p.lastHealthCheck,
          errorCount: p.errorCount,
          lastError: p.lastError,
          usage: usageById.get(p.id) ?? { providerId: p.id, sessions: 0, messages: 0, lastUsedAt: null },
        })),
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load models data',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { providerId?: string; model?: string };

    if (!body.providerId || !body.model) {
      return NextResponse.json(
        { success: false, error: 'providerId and model are required', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const provider = await db.aiProvider.findUnique({ where: { id: body.providerId } });
    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found', timestamp: new Date().toISOString() },
        { status: 404, headers }
      );
    }

    const updated = await db.aiProvider.update({
      where: { id: body.providerId },
      data: { model: body.model },
    });

    providerGateway.dispose();

    return NextResponse.json(
      { success: true, data: updated, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider model',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
