import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';
import type { SystemSettingEntry } from '@/types';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const settings = await db.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });

    // Mask secret values
    const masked = settings.map((s) => ({
      ...s,
      value: s.isSecret ? '••••••••' : s.value,
    }));

    return NextResponse.json(
      { success: true, data: masked, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list settings',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Partial<SystemSettingEntry>;

    if (!body.key || body.value === undefined) {
      return NextResponse.json(
        { success: false, error: 'key and value are required', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const setting = await db.systemSetting.upsert({
      where: { key: body.key },
      update: {
        value: body.value,
        description: body.description,
        category: body.category || 'general',
        isSecret: body.isSecret || false,
      },
      create: {
        key: body.key,
        value: body.value,
        description: body.description || null,
        category: body.category || 'general',
        isSecret: body.isSecret || false,
      },
    });

    return NextResponse.json(
      { success: true, data: setting, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update setting',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
