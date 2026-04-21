import { NextRequest } from 'next/server';
import { providerGateway } from '@/services/providerGateway';
import { memoryService } from '@/services/memoryService';
import { buildAgentSystemPrompt } from '@/services/promptEngine';
import { createLogger } from '@/lib/logger';
import { getIdentityHeader } from '@/lib/identity';
import { validateInput, getRefusalResponse } from '@/lib/ethics';
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

  const timingDebug = process.env.CHAT_STREAM_TIMING_DEBUG === 'true';
  const t0 = timingDebug ? Date.now() : 0;
  const streamRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const defaultMaxTokens = Number(process.env.CHAT_DEFAULT_MAX_TOKENS) || 256;
  const defaultTemperature = process.env.CHAT_DEFAULT_TEMPERATURE
    ? Number(process.env.CHAT_DEFAULT_TEMPERATURE)
    : undefined;

  try {
    let body: ChatRequest;
    const rawBody = await request.text();
    try {
      body = JSON.parse(rawBody) as ChatRequest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to parse JSON body for chat stream', err as Error);
      logger.error('Raw body (prefix)', undefined, { prefix: rawBody.slice(0, 80) });
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

    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      const ethicsResult = validateInput(lastUserMessage.content);
      if (!ethicsResult.safe) {
        return new Response(
          `event: error\ndata: ${JSON.stringify({
            error: 'Content blocked by ethical guidelines',
            ethicsResult: {
              category: ethicsResult.category,
              reason: ethicsResult.reason,
            },
            refusalText: getRefusalResponse(ethicsResult.category),
          })}\n\n`,
          {
            status: 403,
            headers,
          },
        );
      }
    }

    // Resolve agent defaults
    let systemPrompt: string | undefined;
    let agentProviderId: string | undefined;
    let agentModel: string | undefined;
    let agentMaxTokens: number | undefined;
    let agentTemperature: number | undefined;

    if (body.agentId) {
      try {
        const tAgent0 = timingDebug ? Date.now() : 0;
        const { db } = await import('@/lib/db');
        const agent = await db.agent.findUnique({
          where: { id: body.agentId },
          include: { provider: true },
        });
        if (agent) {
          agentProviderId = agent.providerId || undefined;
          const parsedConfig = typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config;
          const agentConfig = {
            id: agent.id,
            name: agent.name,
            type: agent.type as 'chatbot' | 'assistant' | 'coder' | 'researcher' | 'custom',
            status: agent.status as 'active' | 'inactive' | 'maintenance',
            personaName: agent.personaName || undefined,
            systemPrompt: agent.systemPrompt || undefined,
            description: agent.description || undefined,
            config: parsedConfig,
            providerId: agent.providerId || undefined,
          };
          agentModel = (agentConfig.config as { model?: string } | undefined)?.model;
          agentMaxTokens = (agentConfig.config as { maxTokens?: number } | undefined)?.maxTokens;
          agentTemperature = (agentConfig.config as { temperature?: number } | undefined)?.temperature;

          // Fetch agent memories for context
          const tMem0 = timingDebug ? Date.now() : 0;
          const [{ memories: agentMemories }, { memories: individualMemories }] = await Promise.all([
            memoryService.getAgentMemories(agent.id, { limit: 20 }),
            memoryService.getIndividualMemories({ limit: 10 }),
          ]);

          // Build memory context
          const memoryContextParts: string[] = [];
          if (agentMemories.length > 0) {
            memoryContextParts.push('[AGENT_MEMORIES]');
            const safeAgentMemories = agentMemories.slice(0, 12);
            memoryContextParts.push(
              ...safeAgentMemories.map((m) => {
                const topic = m.topic ?? 'topic';
                const content = (m.content ?? '').slice(0, 380);
                return `- ${topic}: ${content}`;
              }),
            );
          }
          if (individualMemories.length > 0) {
            memoryContextParts.push('[CONVERSATION_MEMORIES]');
            const safeIndividualMemories = individualMemories.slice(0, 8);
            memoryContextParts.push(
              ...safeIndividualMemories.map((m) => {
                const memoryType = m.memoryType ?? 'memory';
                const content = (m.content ?? '').slice(0, 380);
                return `- ${memoryType}: ${content}`;
              }),
            );
          }
          const memoryContext = memoryContextParts.length > 0 ? memoryContextParts.join('\n') : undefined;

          systemPrompt = buildAgentSystemPrompt(agentConfig, memoryContext);

          if (timingDebug) {
            logger.info('chat.stream timing: agent+mem', {
              streamRequestId,
              agentId: agent.id,
              agentMs: Date.now() - tAgent0,
              memMs: Date.now() - tMem0,
              agentMemCount: agentMemories.length,
              individualMemCount: individualMemories.length,
              systemPromptLength: systemPrompt.length,
            });
          }
        }
      } catch (err) {
        logger.warn('Failed to load agent config for streaming', { error: err });
      }
    }

    const effectiveProviderId = body.providerId ?? agentProviderId;
    const effectiveMaxTokens = body.maxTokens ?? agentMaxTokens ?? defaultMaxTokens;
    const effectiveTemperature = body.temperature ?? agentTemperature ?? defaultTemperature;

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
    let firstChunkAt: number | null = null;
    let chunkCount = 0;

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        let streamClosed = false;
        const abortHandler = () => {
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // ignore
          }
        };

        if (request.signal.aborted) abortHandler();
        request.signal.addEventListener('abort', abortHandler);

        const sendEvent = (event: string, data: unknown) => {
          if (streamClosed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            streamClosed = true;
          }
        };

        sendEvent('session', { sessionId: activeSessionId });

        try {
          const tProv0 = timingDebug ? Date.now() : 0;
          await providerGateway.chatStream(body.messages as ChatMessage[], {
            providerId: effectiveProviderId,
            systemPrompt,
            temperature: effectiveTemperature,
            maxTokens: effectiveMaxTokens,
            model: agentModel,
            onChunk: (chunk) => {
              if (streamClosed) return;
              finalChunk = chunk;
              chunkCount += 1;
              if (timingDebug && firstChunkAt === null) {
                firstChunkAt = Date.now();
                logger.info('chat.stream timing: first_chunk', {
                  streamRequestId,
                  sessionId: activeSessionId,
                  ttfcFromProviderStartMs: firstChunkAt - tProv0,
                  ttfcFromRequestStartMs: firstChunkAt - t0,
                  providerId: effectiveProviderId ?? null,
                  model: agentModel ?? null,
                  effectiveMaxTokens,
                  effectiveTemperature: effectiveTemperature ?? null,
                  systemPromptLength: systemPrompt?.length ?? 0,
                });
              }
              if (chunk.content) {
                fullText += chunk.content;
              }
              sendEvent('chunk', chunk);
            },
          });

          if (timingDebug) {
            logger.info('chat.stream timing: provider', {
              streamRequestId,
              sessionId: activeSessionId,
              providerMs: Date.now() - tProv0,
              totalMs: Date.now() - t0,
              providerId: effectiveProviderId ?? null,
              model: agentModel ?? null,
              chunkCount,
              hadFirstChunk: firstChunkAt !== null,
              ttfcFromProviderStartMs: firstChunkAt ? firstChunkAt - tProv0 : null,
              ttfcFromRequestStartMs: firstChunkAt ? firstChunkAt - t0 : null,
              effectiveMaxTokens,
              effectiveTemperature: effectiveTemperature ?? null,
              systemPromptLength: systemPrompt?.length ?? 0,
            });
          }

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
          try {
            request.signal.removeEventListener('abort', abortHandler);
          } catch {
            // ignore
          }
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

        try {
          request.signal.removeEventListener('abort', abortHandler);
        } catch {
          // ignore
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
