import { NextRequest, NextResponse } from 'next/server';
import { providerGateway } from '@/services/providerGateway';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

type RouteContext = { params: Promise<{ id: string; action: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id, action } = await context.params;

    if (action === 'test') {
      const health = await providerGateway.testProvider(id);
      return NextResponse.json(
        { success: true, data: health, timestamp: new Date().toISOString() },
        { status: 200, headers }
      );
    }

    if (action === 'activate') {
      await providerGateway.setActiveProvider(id);
      return NextResponse.json(
        { success: true, data: { activated: id }, timestamp: new Date().toISOString() },
        { status: 200, headers }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action', timestamp: new Date().toISOString() },
      { status: 400, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Provider action failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
