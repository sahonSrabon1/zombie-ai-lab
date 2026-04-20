import { NextRequest, NextResponse } from 'next/server';
import { getSystemTemplates, getTemplate } from '@/services/promptEngine';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      const template = getTemplate(name);
      if (!template) {
        return NextResponse.json(
          { success: false, error: `Template '${name}' not found`, timestamp: new Date().toISOString() },
          { status: 404, headers }
        );
      }
      return NextResponse.json(
        { success: true, data: template, timestamp: new Date().toISOString() },
        { status: 200, headers }
      );
    }

    const templates = getSystemTemplates();
    return NextResponse.json(
      { success: true, data: templates, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get templates',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
