import { NextRequest, NextResponse } from 'next/server';
import { providerGateway } from '@/services/providerGateway';
import { memoryService } from '@/services/memoryService';
import { validateInput } from '@/lib/ethics';
import { buildAgentSystemPrompt } from '@/services/promptEngine';
import { createLogger } from '@/lib/logger';
import { getIdentityHeader } from '@/lib/identity';
import type { ChatRequest, ChatResponse, ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ProviderError } from '@/providers/IProvider';

const logger = createLogger('chat-api');
const headers = { 'X-Powered-By': getIdentityHeader() };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'messages array is required and must not be empty', timestamp: new Date().toISOString() },
        { status: 400, headers }
      );
    }

    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      const ethicsResult = validateInput(lastUserMessage.content);
      if (!ethicsResult.safe) {
        return NextResponse.json(
          {
            success: false,
            error: 'Content blocked by ethical guidelines',
            ethicsResult: {
              category: ethicsResult.category,
              reason: ethicsResult.reason,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 403, headers }
        );
      }
    }

    // Build system prompt + resolve agent defaults
    let systemPrompt: string | undefined;
    let agentProviderId: string | undefined;
    let agentModel: string | undefined;
    if (body.agentId) {
      try {
        const { db } = await import('@/lib/db');
        const agent = await db.agent.findUnique({
          where: { id: body.agentId },
          include: { provider: true },
        });
        if (agent) {
          agentProviderId = agent.providerId || undefined;
          const agentConfig = {
            name: agent.name,
            type: agent.type as 'chatbot' | 'assistant' | 'coder' | 'researcher' | 'custom',
            status: agent.status as 'active' | 'inactive' | 'maintenance',
            personaName: agent.personaName || undefined,
            systemPrompt: agent.systemPrompt || undefined,
            description: agent.description || undefined,
            config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
            providerId: agent.providerId || undefined,
          };
          agentModel = (agentConfig.config as { model?: string } | undefined)?.model;
          systemPrompt = buildAgentSystemPrompt(agentConfig);
        }
      } catch (err) {
        logger.warn('Failed to load agent config, using default system prompt', { error: err });
      }
    }

    const effectiveProviderId = body.providerId ?? agentProviderId;

    // Create/attach chat session
    let activeSessionId: string;
    if (body.sessionId) {
      const existing = await memoryService.getSession(body.sessionId);
      activeSessionId = existing?.id || (await memoryService.createSession({ agentId: body.agentId, providerId: effectiveProviderId })).id;
    } else {
      activeSessionId = (await memoryService.createSession({ agentId: body.agentId, providerId: effectiveProviderId })).id;
    }

    // Persist user message (last one)
    const latestUser = [...body.messages].reverse().find((m) => m.role === 'user');
    if (latestUser) {
      await memoryService.addMessage(activeSessionId, {
        role: 'user',
        content: latestUser.content,
        metadata: { agentId: body.agentId ?? null, providerId: effectiveProviderId ?? null },
      });
    }

    // Prepare for streaming
    const encoder = new TextEncoder();
    let assistantFullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent('session', { sessionId: activeSessionId });

          const finalChunk = await providerGateway.chatStream(body.messages, {
            providerId: effectiveProviderId,
            systemPrompt,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
            model: agentModel,
            onChunk: (chunk) => {
              assistantFullContent += chunk.content;
              sendEvent('chunk', {
                id: uuidv4(),
                content: chunk.content,
                model: chunk.model,
                provider: chunk.provider,
                sessionId: activeSessionId
              });
            },
          });

          // Finalize and persist
          await memoryService.addMessage(activeSessionId, {
            role: 'assistant',
            content: assistantFullContent,
            model: finalChunk.model,
            provider: finalChunk.provider,
            tokenCount: finalChunk.tokenCount,
            latencyMs: finalChunk.latencyMs,
            metadata: { finishReason: finalChunk.finishReason },
          });

          // Trigger background memory extraction
          void memoryService.extractIndividualMemories(activeSessionId);

          sendEvent('done', {
            model: finalChunk.model,
            provider: finalChunk.provider,
            tokenCount: finalChunk.tokenCount,
            latencyMs: finalChunk.latencyMs,
            finishReason: finalChunk.finishReason,
          });
        } catch (err) {
          logger.error('Stream failure', err as Error);
          sendEvent('error', { error: (err as Error).message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        ...headers,
      },
    });
  } catch (error) {
    logger.error('Chat API error', error as Error);
    if (error instanceof ProviderError) {
      const status = error.statusCode ?? 502;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          providerType: error.providerType,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
        },
        { status, headers }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Chat request failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers }
    );
  }
}
