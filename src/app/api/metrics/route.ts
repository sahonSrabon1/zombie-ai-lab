import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIdentityHeader } from '@/lib/identity';

const headers = { 'X-Powered-By': getIdentityHeader() };

export async function GET() {
  try {
    const [
      totalProviders,
      activeAgents,
      totalSessions,
      totalAgentMemories,
      totalIndividualMemories,
      totalToolExecutions,
      successfulExecutions,
    ] = await Promise.all([
      db.aiProvider.count(),
      db.agent.count({ where: { status: 'active' } }),
      db.chatSession.count(),
      db.agentMemory.count(),
      db.individualMemory.count(),
      db.toolExecutionLog.count(),
      db.toolExecutionLog.count({ where: { status: 'success' } }),
    ]);

    const toolSuccessRate = totalToolExecutions > 0
      ? ((successfulExecutions / totalToolExecutions) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json(
      {
        success: true,
        data: {
          providers: { total: totalProviders },
          agents: { total: activeAgents },
          sessions: { total: totalSessions },
          memories: {
            agent: totalAgentMemories,
            individual: totalIndividualMemories,
            total: totalAgentMemories + totalIndividualMemories,
          },
          tools: {
            totalExecutions: totalToolExecutions,
            successRate: `${toolSuccessRate}%`,
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
        error: error instanceof Error ? error.message : 'Metrics fetch failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
