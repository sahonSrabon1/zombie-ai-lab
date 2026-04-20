import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SYSTEM_IDENTITY } from '@/lib/identity';
import { getIdentityHeader } from '@/lib/identity';
import type { HealthStatus } from '@/types';

const START_TIME = Date.now();

const headers = {
  'X-Powered-By': getIdentityHeader(),
};

export async function GET() {
  try {
    // Check database
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    // Check Stock Server
    let stockServerStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      const baseUrl = process.env.STOCK_SERVER_BASE_URL || 'http://localhost:9998';
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      stockServerStatus = res.ok ? 'connected' : 'disconnected';
    } catch {
      stockServerStatus = 'disconnected';
    }

    // Provider status from DB
    const providers = await db.aiProvider.findMany({
      select: { type: true, status: true },
    });
    const providerStatuses: Record<string, string> = {};
    for (const p of providers) {
      providerStatuses[p.type] = p.status;
    }

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
      dbStatus === 'connected' ? 'healthy' : 'unhealthy';

    const health: HealthStatus = {
      status: overallStatus,
      version: SYSTEM_IDENTITY.version,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      services: {
        database: dbStatus,
        stockServer: stockServerStatus,
        providers: providerStatuses as Record<string, 'active' | 'inactive' | 'error'>,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: health, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
