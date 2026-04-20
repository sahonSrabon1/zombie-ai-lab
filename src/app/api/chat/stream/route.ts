import { NextRequest } from 'next/server';
import { providerGateway } from '@/services/providerGateway';
import { memoryService } from '@/services/memoryService';
import { buildAgentSystemPrompt } from '@/services/promptEngine';
import { createLogger } from '@/lib/logger';
import { getIdentityHeader } from '@/lib/identity';
import type { ChatMessage, ChatRequest, StreamChunk } from '@/types';
import { ProviderError } from '@/providers/IProvider';

const logger = createLogger('chat-stream-api');
const headersBase = { 'X-Powered-By': getIdentityHeader() };

export async function POST(request: NextRequest) {
  const headers = {
    ...headersBase,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };

  try {
    let body: ChatRequest;
    const rawBody = await request.text();
    try {
      body = JSON.parse(rawBody) as ChatRequest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to parse JSON body for chat stream', err as Error);
      logger.error('Raw body (prefix)', {
        prefix: rawBody.slice(0, 80),
      });
      return new Response(
        `event: error\ndata: ${JSON.stringify({ error: message, bodyPrefix: rawBody.slice(0, 80) })}\n\n`,
        {
          status: 400,
          headers,
        },
      );
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(`event: error\ndata: ${JSON.stringify({ error: 'messages is required' })}\n\n`, {
        status: 400,
        headers,
      });
    }

    // Resolve agent defaults
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
            id: agent.id,
            name: agent.name,
            type: agent.type as 'chatbot' | 'assistant' | 'coder' | 'researcher' | 'custom',
            status: agent.status as 'active' | 'inactive' | 'maintenance',
            personaName: agent.personaName || undefined,
            systemPrompt: agent.systemPrompt || undefined,
            description: agent.description || undefined,
            config: agent.config,
            providerId: agent.providerId || undefined,
          };
          agentModel = (agentConfig.config as { model?: string } | undefined)?.model;

          // Fetch agent memories for context
          const { memories: agentMemories } = await memoryService.getAgentMemories(agent.id, { limit: 20 });
          // Fetch recent individual memories
          const { memories: individualMemories } = await memoryService.getIndividualMemories({ limit: 10 });

          // Build memory context
          const memoryContextParts: string[] = [];
          if (agentMemories.length > 0) {
            memoryContextParts.push('[AGENT_MEMORIES]');
            memoryContextParts.push(...agentMemories.map(m => `- ${m.topic}: ${m.content}`));
          }
          if (individualMemories.length > 0) {
            memoryContextParts.push('[CONVERSATION_MEMORIES]');
            memoryContextParts.push(...individualMemories.map(m => `- ${m.memoryType}: ${m.content}`));
          }
          const memoryContext = memoryContextParts.length > 0 ? memoryContextParts.join('\n') : undefined;

          systemPrompt = buildAgentSystemPrompt(agentConfig, memoryContext);
        }
      } catch (err) {
        logger.warn('Failed to load agent config for streaming', { error: err });
      }
    }

    const effectiveProviderId = body.providerId ?? agentProviderId;

    // Create/attach session
    const activeSessionId = body.sessionId
      ? body.sessionId
      : (await memoryService.createSession({
          agentId: body.agentId,
          providerId: effectiveProviderId,
        })).id;

    // Persist user message (latest)
    const latestUser = [...body.messages].reverse().find((m) => m.role === 'user');
    if (latestUser) {
      await memoryService.addMessage(activeSessionId, {
        role: 'user',
        content: latestUser.content,
        metadata: {
          agentId: body.agentId ?? null,
          providerId: effectiveProviderId ?? null,
        },
      });
    }

    const encoder = new TextEncoder();

    let fullText = '';
    let finalChunk: StreamChunk | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('session', { sessionId: activeSessionId });

        try {
          await providerGateway.chatStream(body.messages as ChatMessage[], {
            providerId: effectiveProviderId,
            systemPrompt,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
            model: agentModel,
            onChunk: (chunk) => {
              finalChunk = chunk;
              if (chunk.content) {
                fullText += chunk.content;
              }
              sendEvent('chunk', chunk);
            },
          });

          // Persist assistant message
          await memoryService.addMessage(activeSessionId, {
            role: 'assistant',
            content: fullText,
            model: finalChunk?.model,
            provider: finalChunk?.provider,
            tokenCount: finalChunk?.tokenCount,
            latencyMs: finalChunk?.latencyMs,
            metadata: {
              finishReason: finalChunk?.finishReason,
              streamed: true,
            },
          });

          sendEvent('done', {
            finishReason: finalChunk?.finishReason ?? 'stop',
            model: finalChunk?.model,
            provider: finalChunk?.provider,
            tokenCount: finalChunk?.tokenCount,
            latencyMs: finalChunk?.latencyMs,
          });

          controller.close();
        } catch (err) {
          if (err instanceof ProviderError) {
            sendEvent('error', {
              error: err.message,
              providerType: err.providerType,
              statusCode: err.statusCode,
            });
            controller.close();
            return;
          }

          const message = err instanceof Error ? err.message : String(err);
          sendEvent('error', { error: message });
          controller.close();
        }
      },
    });

    return new Response(stream, { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Chat stream API error', err as Error);
    return new Response(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`, {
      status: 500,
      headers,
    });
  }
}
