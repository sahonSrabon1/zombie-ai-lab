// ─── Memory Service ──────────────────────────────────────────────────────────
// Complete memory management service for ZombieCoder Agentic Hub.
// Handles agent memories, individual memories, chat sessions, and messages
// using Prisma ORM with SQLite (text-based search, no embeddings).

import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import type { AgentMemory, IndividualMemory, ChatSession, ChatMessage } from '@prisma/client';
import type { MemoryEntry } from '@/types';

const logger = createLogger('memory');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely serialize metadata to JSON string for storage */
function stringifyMetadata(metadata: Record<string, unknown> | undefined): string {
  if (metadata === undefined || metadata === null) return '{}';
  try {
    return JSON.stringify(metadata);
  } catch (err) {
    logger.warn('Failed to serialize metadata, using empty object', { metadata });
    return '{}';
  }
}

/** Safely parse metadata from JSON string */
function parseMetadata(json: string): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch (err) {
    logger.warn('Failed to parse metadata JSON, returning empty object', { json });
    return {};
  }
}

/** Default pagination limits */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Clamp a limit value to safe bounds */
function clampLimit(limit?: number): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

/** Validate an offset value */
function clampOffset(offset?: number): number {
  if (offset === undefined) return 0;
  return Math.max(0, Math.floor(offset));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentMemoryFilters {
  limit?: number;
  offset?: number;
  topic?: string;
  priority?: string;
}

export interface AgentMemoryStats {
  total: number;
  byTopic: Record<string, number>;
  byPriority: Record<string, number>;
  avgImportance: number;
}

export interface IndividualMemoryFilters {
  limit?: number;
  offset?: number;
  type?: string;
}

export interface SessionFilters {
  limit?: number;
  offset?: number;
  status?: string;
  agentId?: string;
}

export interface MessageFilters {
  limit?: number;
  offset?: number;
}

export interface MessageInput {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  model?: string;
  provider?: string;
  tokenCount?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

export interface SessionCreateInput {
  agentId?: string;
  providerId?: string;
  title?: string;
}

export interface ImportResult {
  imported: number;
  errors: number;
}

// ─── MemoryService ───────────────────────────────────────────────────────────

export class MemoryService {
  // ─── Agent Memories ──────────────────────────────────────────────────────

  /** Add a memory for an agent */
  async addAgentMemory(agentId: string, entry: MemoryEntry): Promise<AgentMemory> {
    try {
      logger.info('Adding agent memory', { agentId, topic: entry.topic });
      const memory = await db.agentMemory.create({
        data: {
          agentId,
          content: entry.content,
          topic: entry.topic,
          priority: entry.priority ?? 'normal',
          importance: entry.importance ?? 3.0,
          sessionId: entry.sessionId,
          metadata: stringifyMetadata(entry.metadata),
        },
      });
      logger.info('Agent memory created', { memoryId: memory.id, agentId });
      return memory;
    } catch (error) {
      logger.error('Failed to add agent memory', error as Error, { agentId, entry });
      throw error;
    }
  }

  /** Get all memories for an agent (paginated) */
  async getAgentMemories(
    agentId: string,
    options?: AgentMemoryFilters,
  ): Promise<{ memories: AgentMemory[]; total: number }> {
    try {
      const limit = clampLimit(options?.limit);
      const offset = clampOffset(options?.offset);

      const where: Record<string, unknown> = { agentId };
      if (options?.topic !== undefined) {
        where.topic = options.topic;
      }
      if (options?.priority !== undefined) {
        where.priority = options.priority;
      }

      const [memories, total] = await Promise.all([
        db.agentMemory.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.agentMemory.count({ where }),
      ]);

      logger.debug('Retrieved agent memories', { agentId, count: memories.length, total });
      return { memories, total };
    } catch (error) {
      logger.error('Failed to get agent memories', error as Error, { agentId, options });
      throw error;
    }
  }

  /** Search agent memories by text content (LIKE %query%) */
  async searchAgentMemories(
    agentId: string,
    query: string,
    options?: { limit?: number; topic?: string },
  ): Promise<AgentMemory[]> {
    try {
      const limit = clampLimit(options?.limit);

      const where: Record<string, unknown> = {
        agentId,
        // SQLite uses LIKE (case-insensitive by default for ASCII) via Prisma's `contains`
        content: { contains: query },
      };
      if (options?.topic !== undefined) {
        where.topic = options.topic;
      }

      const memories = await db.agentMemory.findMany({
        where,
        take: limit,
        orderBy: { importance: 'desc' },
      });

      logger.info('Searched agent memories', {
        agentId,
        query,
        results: memories.length,
      });
      return memories;
    } catch (error) {
      logger.error('Failed to search agent memories', error as Error, { agentId, query });
      throw error;
    }
  }

  /** Update a specific memory */
  async updateAgentMemory(
    memoryId: string,
    updates: Partial<MemoryEntry>,
  ): Promise<AgentMemory> {
    try {
      logger.info('Updating agent memory', { memoryId });

      const data: Record<string, unknown> = {};
      if (updates.content !== undefined) data.content = updates.content;
      if (updates.topic !== undefined) data.topic = updates.topic;
      if (updates.priority !== undefined) data.priority = updates.priority;
      if (updates.importance !== undefined) data.importance = updates.importance;
      if (updates.sessionId !== undefined) data.sessionId = updates.sessionId;
      if (updates.metadata !== undefined) data.metadata = stringifyMetadata(updates.metadata);

      if (Object.keys(data).length === 0) {
        throw new Error('No valid fields provided for update');
      }

      const memory = await db.agentMemory.update({
        where: { id: memoryId },
        data,
      });

      logger.info('Agent memory updated', { memoryId });
      return memory;
    } catch (error) {
      logger.error('Failed to update agent memory', error as Error, { memoryId });
      throw error;
    }
  }

  /** Delete a specific memory */
  async deleteAgentMemory(memoryId: string): Promise<boolean> {
    try {
      logger.info('Deleting agent memory', { memoryId });
      await db.agentMemory.delete({
        where: { id: memoryId },
      });
      logger.info('Agent memory deleted', { memoryId });
      return true;
    } catch (error) {
      logger.error('Failed to delete agent memory', error as Error, { memoryId });
      return false;
    }
  }

  /** Get memory statistics for an agent */
  async getAgentMemoryStats(agentId: string): Promise<AgentMemoryStats> {
    try {
      const [total, byTopic, byPriority, avgResult] = await Promise.all([
        db.agentMemory.count({ where: { agentId } }),
        db.agentMemory.groupBy({
          by: ['topic'],
          where: { agentId },
          _count: { id: true },
        }),
        db.agentMemory.groupBy({
          by: ['priority'],
          where: { agentId },
          _count: { id: true },
        }),
        db.agentMemory.aggregate({
          where: { agentId },
          _avg: { importance: true },
        }),
      ]);

      const topicCounts: Record<string, number> = {};
      for (const group of byTopic) {
        topicCounts[group.topic ?? 'untagged'] = group._count.id;
      }

      const priorityCounts: Record<string, number> = {};
      for (const group of byPriority) {
        priorityCounts[group.priority] = group._count.id;
      }

      logger.debug('Retrieved agent memory stats', { agentId, total });
      return {
        total,
        byTopic: topicCounts,
        byPriority: priorityCounts,
        avgImportance: avgResult._avg.importance ?? 0,
      };
    } catch (error) {
      logger.error('Failed to get agent memory stats', error as Error, { agentId });
      throw error;
    }
  }

  // ─── Individual Memories ─────────────────────────────────────────────────

  /** Add an individual memory */
  async addIndividualMemory(entry: MemoryEntry): Promise<IndividualMemory> {
    try {
      logger.info('Adding individual memory', { topic: entry.topic });
      const memory = await db.individualMemory.create({
        data: {
          content: entry.content,
          memoryType: (entry as MemoryEntry & { memoryType?: string }).memoryType ?? 'general',
          importance: entry.importance ?? 3.0,
          metadata: stringifyMetadata(entry.metadata),
        },
      });
      logger.info('Individual memory created', { memoryId: memory.id });
      return memory;
    } catch (error) {
      logger.error('Failed to add individual memory', error as Error, { entry });
      throw error;
    }
  }

  /** Get all individual memories (paginated) */
  async getIndividualMemories(
    options?: IndividualMemoryFilters,
  ): Promise<{ memories: IndividualMemory[]; total: number }> {
    try {
      const limit = clampLimit(options?.limit);
      const offset = clampOffset(options?.offset);

      const where: Record<string, unknown> = {};
      if (options?.type !== undefined) {
        where.memoryType = options.type;
      }

      const [memories, total] = await Promise.all([
        db.individualMemory.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.individualMemory.count({ where }),
      ]);

      logger.debug('Retrieved individual memories', { count: memories.length, total });
      return { memories, total };
    } catch (error) {
      logger.error('Failed to get individual memories', error as Error);
      throw error;
    }
  }

  /** Search individual memories by text content */
  async searchIndividualMemories(
    query: string,
    options?: { limit?: number; type?: string },
  ): Promise<IndividualMemory[]> {
    try {
      const limit = clampLimit(options?.limit);

      const where: Record<string, unknown> = {
        // SQLite uses LIKE (case-insensitive by default for ASCII) via Prisma's `contains`
        content: { contains: query },
      };

      if (options?.type !== undefined) {
        where.memoryType = options.type;
      }

      const memories = await db.individualMemory.findMany({
        where,
        take: limit,
        orderBy: { importance: 'desc' },
      });

      logger.info('Searched individual memories', { query, results: memories.length });
      return memories;
    } catch (error) {
      logger.error('Failed to search individual memories', error as Error, { query });
      throw error;
    }
  }

  /** Update an individual memory */
  async updateIndividualMemory(
    memoryId: string,
    updates: Partial<MemoryEntry>,
  ): Promise<IndividualMemory> {
    try {
      logger.info('Updating individual memory', { memoryId });

      const data: Record<string, unknown> = {};
      if (updates.content !== undefined) data.content = updates.content;
      if ((updates as Partial<MemoryEntry & { memoryType?: string }>).memoryType !== undefined) {
        data.memoryType = (updates as Partial<MemoryEntry & { memoryType?: string }>).memoryType;
      }
      if (updates.importance !== undefined) data.importance = updates.importance;
      if (updates.metadata !== undefined) data.metadata = stringifyMetadata(updates.metadata);

      if (Object.keys(data).length === 0) {
        throw new Error('No valid fields provided for update');
      }

      const memory = await db.individualMemory.update({
        where: { id: memoryId },
        data,
      });

      logger.info('Individual memory updated', { memoryId });
      return memory;
    } catch (error) {
      logger.error('Failed to update individual memory', error as Error, { memoryId });
      throw error;
    }
  }

  /** Delete an individual memory */
  async deleteIndividualMemory(memoryId: string): Promise<boolean> {
    try {
      logger.info('Deleting individual memory', { memoryId });
      await db.individualMemory.delete({
        where: { id: memoryId },
      });
      logger.info('Individual memory deleted', { memoryId });
      return true;
    } catch (error) {
      logger.error('Failed to delete individual memory', error as Error, { memoryId });
      return false;
    }
  }

  // ─── Session Management ─────────────────────────────────────────────────

  /** Create a new chat session */
  async createSession(data: SessionCreateInput): Promise<ChatSession> {
    try {
      logger.info('Creating chat session', { agentId: data.agentId, providerId: data.providerId });

      const sessionData: Record<string, unknown> = { status: 'active' };
      if (data.agentId !== undefined) sessionData.agentId = data.agentId;
      if (data.providerId !== undefined) sessionData.providerId = data.providerId;
      if (data.title !== undefined) sessionData.title = data.title;

      const session = await db.chatSession.create({
        data: sessionData,
      });

      logger.info('Chat session created', { sessionId: session.id });
      return session;
    } catch (error) {
      logger.error('Failed to create chat session', error as Error, { data });
      throw error;
    }
  }

  /** Get session with messages */
  async getSession(
    sessionId: string,
  ): Promise<(ChatSession & { messages: ChatMessage[] }) | null> {
    try {
      const session = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!session) {
        logger.debug('Session not found', { sessionId });
        return null;
      }

      logger.debug('Retrieved session with messages', {
        sessionId,
        messageCount: session.messages.length,
      });
      return session;
    } catch (error) {
      logger.error('Failed to get session', error as Error, { sessionId });
      throw error;
    }
  }

  /** List sessions (paginated) */
  async listSessions(
    options?: SessionFilters,
  ): Promise<{ sessions: ChatSession[]; total: number }> {
    try {
      const limit = clampLimit(options?.limit);
      const offset = clampOffset(options?.offset);

      const where: Record<string, unknown> = {};
      if (options?.status !== undefined) where.status = options.status;
      if (options?.agentId !== undefined) where.agentId = options.agentId;

      const [sessions, total] = await Promise.all([
        db.chatSession.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: { messages: true },
            },
          },
        }),
        db.chatSession.count({ where }),
      ]);

      logger.debug('Listed sessions', { count: sessions.length, total });
      return { sessions, total };
    } catch (error) {
      logger.error('Failed to list sessions', error as Error);
      throw error;
    }
  }

  /** Add a message to a session */
  async addMessage(sessionId: string, message: MessageInput): Promise<ChatMessage> {
    try {
      logger.info('Adding message to session', {
        sessionId,
        role: message.role,
      });

      const chatMessage = await db.chatMessage.create({
        data: {
          sessionId,
          role: message.role,
          content: message.content,
          ...(message.model !== undefined && { model: message.model }),
          ...(message.provider !== undefined && { provider: message.provider }),
          ...(message.tokenCount !== undefined && { tokenCount: message.tokenCount }),
          ...(message.latencyMs !== undefined && { latencyMs: message.latencyMs }),
          ...(message.metadata !== undefined && { metadata: stringifyMetadata(message.metadata) }),
        },
      });

      // Update the session's updatedAt timestamp to reflect the new message
      await db.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      logger.info('Message added to session', {
        sessionId,
        messageId: chatMessage.id,
        role: message.role,
      });

      return chatMessage;
    } catch (error) {
      logger.error('Failed to add message to session', error as Error, { sessionId, role: message.role });
      throw error;
    }
  }

  /** Get session messages (paginated) */
  async getSessionMessages(
    sessionId: string,
    options?: MessageFilters,
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    try {
      const limit = clampLimit(options?.limit);
      const offset = clampOffset(options?.offset);

      const where = { sessionId };

      const [messages, total] = await Promise.all([
        db.chatMessage.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'asc' },
        }),
        db.chatMessage.count({ where }),
      ]);

      logger.debug('Retrieved session messages', {
        sessionId,
        count: messages.length,
        total,
      });

      return { messages, total };
    } catch (error) {
      logger.error('Failed to get session messages', error as Error, { sessionId });
      throw error;
    }
  }

  /** Close a session */
  async closeSession(sessionId: string): Promise<ChatSession> {
    try {
      logger.info('Closing session', { sessionId });
      const session = await db.chatSession.update({
        where: { id: sessionId },
        data: { status: 'closed' },
      });
      logger.info('Session closed', { sessionId });
      return session;
    } catch (error) {
      logger.error('Failed to close session', error as Error, { sessionId });
      throw error;
    }
  }

  /** Delete a session and all its messages (cascading) */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      logger.info('Deleting session and all messages', { sessionId });

      // Verify session exists first
      const session = await db.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        logger.warn('Attempted to delete non-existent session', { sessionId });
        return false;
      }

      // Messages are deleted via cascade (onDelete: Cascade in schema)
      await db.chatSession.delete({
        where: { id: sessionId },
      });

      logger.info('Session and messages deleted', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', error as Error, { sessionId });
      return false;
    }
  }

  // ─── Export / Import ────────────────────────────────────────────────────

  /** Export agent memories as JSON string */
  async exportAgentMemories(agentId: string): Promise<string> {
    try {
      logger.info('Exporting agent memories', { agentId });

      // Fetch all memories for this agent (no pagination — export means all)
      const memories = await db.agentMemory.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      const exportData = memories.map((mem) => ({
        id: mem.id,
        content: mem.content,
        topic: mem.topic,
        priority: mem.priority,
        importance: mem.importance,
        sessionId: mem.sessionId,
        metadata: parseMetadata(mem.metadata),
        createdAt: mem.createdAt.toISOString(),
        updatedAt: mem.updatedAt.toISOString(),
      }));

      const json = JSON.stringify(exportData, null, 2);
      logger.info('Agent memories exported', { agentId, count: exportData.length });
      return json;
    } catch (error) {
      logger.error('Failed to export agent memories', error as Error, { agentId });
      throw error;
    }
  }

  /** Import memories from JSON string */
  async importAgentMemories(agentId: string, json: string): Promise<ImportResult> {
    let entries: unknown[] = [];

    try {
      logger.info('Importing agent memories', { agentId, jsonLength: json.length });

      try {
        const parsed: unknown = JSON.parse(json);
        if (!Array.isArray(parsed)) {
          throw new Error('Expected a JSON array of memory objects');
        }
        entries = parsed;
      } catch (parseError) {
        logger.error('Invalid JSON for import', parseError as Error, { agentId });
        return { imported: 0, errors: 1 };
      }

      if (entries.length === 0) {
        logger.info('Empty array provided for import, nothing to do', { agentId });
        return { imported: 0, errors: 0 };
      }

      let imported = 0;
      let errors = 0;

      for (const entry of entries) {
        try {
          const mem = entry as Record<string, unknown>;

          // Validate required field
          if (typeof mem.content !== 'string' || mem.content.trim().length === 0) {
            logger.warn('Skipping memory entry without valid content', { entry });
            errors++;
            continue;
          }

          await db.agentMemory.create({
            data: {
              agentId,
              content: mem.content,
              topic: typeof mem.topic === 'string' ? mem.topic : null,
              priority:
                typeof mem.priority === 'string' &&
                ['low', 'normal', 'high', 'critical'].includes(mem.priority)
                  ? mem.priority
                  : 'normal',
              importance:
                typeof mem.importance === 'number'
                  ? Math.min(5.0, Math.max(1.0, mem.importance))
                  : 3.0,
              sessionId: typeof mem.sessionId === 'string' ? mem.sessionId : null,
              metadata:
                mem.metadata !== undefined && typeof mem.metadata === 'object'
                  ? stringifyMetadata(mem.metadata as Record<string, unknown>)
                  : '{}',
            },
          });

          imported++;
        } catch (itemError) {
          logger.error('Failed to import individual memory entry', itemError as Error);
          errors++;
        }
      }

      logger.info('Agent memory import completed', { agentId, imported, errors });
      return { imported, errors };
    } catch (error) {
      logger.error('Failed to import agent memories', error as Error, { agentId });
      return { imported: 0, errors: entries.length };
    }
  }
  /** Background task to extract individual memories from a chat history */
  async extractIndividualMemories(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session || session.messages.length < 2) return;

      const lastUserMsg = [...session.messages].reverse().find(m => m.role === 'user');
      if (!lastUserMsg) return;

      logger.info('Starting individual memory extraction', { sessionId });

      const patterns = [
        { regex: /my name is ([a-z\s]+)/i, type: 'fact', importance: 4.0 },
        { regex: /i like ([a-z\s]+)/i, type: 'preference', importance: 3.0 },
        { regex: /i'm a ([a-z\s]+)/i, type: 'technical', importance: 3.5 },
      ];

      for (const p of patterns) {
        const match = lastUserMsg.content.match(p.regex);
        if (match && match[1]) {
          await this.addIndividualMemory({
            content: match[0],
            memoryType: p.type,
            importance: p.importance,
            metadata: { sourceSessionId: sessionId },
          } as any);
          logger.info('Extracted individual memory', { type: p.type, content: match[0] });
        }
      }
    } catch (err) {
      logger.error('Failed to extract individual memories', err as Error, { sessionId });
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const memoryService = new MemoryService();
