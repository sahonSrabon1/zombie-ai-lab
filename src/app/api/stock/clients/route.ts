import { NextResponse } from 'next/server';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const baseUrl = process.env.STOCK_SERVER_BASE_URL || 'http://localhost:9998';
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/clients`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock server clients failed: ${res.status}`,
          details: json,
          timestamp: new Date().toISOString(),
        },
        { status: 502, headers }
      );
    }

    return NextResponse.json(
      { success: true, data: json, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock clients',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
