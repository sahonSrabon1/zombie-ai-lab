import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { providerGateway } from '@/services/providerGateway';
import type { ApiResponse } from '@/types';

const logger = createLogger('api:providers:[id]:activate');

const POWERED_BY = 'ZombieCoder-by-SahonSrabon';

function poweredByHeaders() {
  return { 'X-Powered-By': POWERED_BY };
}

// POST /api/providers/:id/activate — Set as active provider
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const provider = await db.aiProvider.findUnique({ where: { id } });
    if (!provider) {
      const body: ApiResponse = {
        success: false,
        error: 'Provider not found',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(body, { status: 404, headers: poweredByHeaders() });
    }

    await providerGateway.setActiveProvider(id);
    logger.info('Provider activated via API', { providerId: id, providerName: provider.name });

    const body: ApiResponse<{ activated: boolean; providerId: string; providerName: string }> = {
      success: true,
      data: { activated: true, providerId: id, providerName: provider.name },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(body, { status: 200, headers: poweredByHeaders() });
  } catch (error) {
    logger.error('Provider activation failed', error as Error);
    const body: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Provider activation failed',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: 500, headers: poweredByHeaders() });
  }
}
