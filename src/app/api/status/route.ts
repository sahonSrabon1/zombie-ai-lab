import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SYSTEM_IDENTITY } from '@/lib/identity';
import { getIdentityHeader } from '@/lib/identity';

const START_TIME = Date.now();
const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const [agentCount, sessionCount, agentMemCount, individualMemCount, providerCount] = await Promise.all([
      db.agent.count(),
      db.chatSession.count(),
      db.agentMemory.count(),
      db.individualMemory.count(),
      db.aiProvider.count(),
    ]);
    const memoryCount = agentMemCount + individualMemCount;

    const activeProvider = await db.aiProvider.findFirst({
      where: { isDefault: true },
      select: { name: true, type: true, model: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          identity: {
            name: SYSTEM_IDENTITY.name,
            version: SYSTEM_IDENTITY.version,
            tagline: SYSTEM_IDENTITY.tagline,
            owner: SYSTEM_IDENTITY.owner,
            organization: SYSTEM_IDENTITY.organization,
          },
          uptime: Math.floor((Date.now() - START_TIME) / 1000),
          activeProvider,
          counts: {
            providers: providerCount,
            agents: agentCount,
            sessions: sessionCount,
            memories: memoryCount,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
