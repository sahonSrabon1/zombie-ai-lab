import { NextRequest, NextResponse } from 'next/server';
import { providerGateway } from '@/services/providerGateway';
import { getIdentityHeader } from '@/lib/identity';
import type { ProviderConfig } from '@/types';

const headers = { 'X-Powered-By': getIdentityHeader() };

function isValidEnvVarName(value: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(value);
}

export async function GET() {
  try {
    const providers = await providerGateway.listProviders();
    return NextResponse.json(
      { success: true, data: providers, timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list providers',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProviderConfig;

    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: 'name and type are required', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const validTypes = ['ollama', 'openai', 'gemini', 'llamacpp'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${validTypes.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

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

    const provider = await providerGateway.createProvider(body);
    const health = provider.getHealth();

    return NextResponse.json(
      {
        success: true,
        data: { id: 'created', name: body.name, type: body.type, health },
        timestamp: new Date().toISOString(),
      },
      { status: 201, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create provider',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
