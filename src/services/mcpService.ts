// ─── ZombieCoder MCP Tool Registry & Execution Service ─────────────────────────
// Complete MCP (Model Context Protocol) tool management, assignment, execution,
// logging, and statistics. No mocks. Real execution where possible.

import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import type { ToolDefinition, ToolExecutionRequest, ToolExecutionResult } from '@/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const logger = createLogger('mcp');

// ─── Prisma model types (mirror of generated types) ──────────────────────────

interface McpToolRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: string; // JSON string
  requiredAuth: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignments?: AgentToolAssignmentRecord[];
  executionLogs?: ToolExecutionLogRecord[];
}

interface AgentToolAssignmentRecord {
  id: string;
  agentId: string;
  toolId: string;
  assignedAt: Date;
}

interface ToolExecutionLogRecord {
  id: string;
  toolId: string;
  agentId: string | null;
  sessionId: string | null;
  inputParams: string;   // JSON string
  outputResult: string | null;
  status: string;        // "success" | "error" | "timeout"
  errorMessage: string | null;
  executionMs: number | null;
  createdAt: Date;
}

// ─── Shell command whitelist ─────────────────────────────────────────────────

const SHELL_WHITELIST: ReadonlySet<string> = new Set([
  'ls', 'ls -la', 'ls -al', 'ls -R',
  'pwd',
  'whoami',
  'hostname',
  'date',
  'uname', 'uname -a',
  'which',
  'env',
  'echo',
  'cat',
  'head', 'tail',
  'wc', 'wc -l',
  'file',
  'stat',
  'df', 'df -h',
  'du', 'du -sh', 'du -h',
  'free', 'free -h',
  'ps', 'ps aux',
  'uptime',
  'node', 'node --version',
  'npm', 'npm --version', 'npm ls', 'npm run', 'npm test', 'npm list',
  'npx',
  'git', 'git status', 'git log', 'git diff', 'git branch', 'git remote', 'git show',
  'git rev-parse',
  'tree',
  'mkdir', 'touch',
  'grep', 'rg', 'find',
  'curl',
  'pip', 'pip --version',
  'python', 'python --version', 'python3', 'python3 --version',
  'pnpm', 'pnpm --version',
  'yarn', 'yarn --version',
  'bun', 'bun --version',
  'docker', 'docker ps', 'docker images',
]);

/**
 * Validate a shell command against the whitelist.
 * Returns true if the base command (first token) is whitelisted.
 */
function isShellCommandAllowed(command: string): boolean {
  const trimmed = command.trim();
  if (!trimmed) return false;

  // Reject dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf/,
    /mkfs/,
    /dd\s+if=/,
    />\s*\/dev\//,
    /chmod\s+777/,
    /sudo\b/,
    /su\s/,
    /passwd/,
    /shutdown/,
    /reboot/,
    /init\s+/,
    /kill\s+-9/,
    /pkill/,
    /:(){ :\|:& };:/,
    /wget.*\|\s*bash/,
    /curl.*\|\s*(ba)?sh/,
  ];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) return false;
  }

  // Check exact match first
  if (SHELL_WHITELIST.has(trimmed)) return true;

  // Check base command (first token)
  const baseCommand = trimmed.split(/\s+/)[0];
  return SHELL_WHITELIST.has(baseCommand);
}

// ─── Built-in tool definitions ───────────────────────────────────────────────

interface BuiltinToolDef extends ToolDefinition {
  category: string;
  enabled: boolean;
  requiredAuth: boolean;
}

const BUILTIN_TOOLS: readonly BuiltinToolDef[] = [
  {
    name: 'file_read',
    description: 'Read the contents of a file from the filesystem. Returns the file content as a string. Supports text files up to 10MB.',
    category: 'file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file to read',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path'],
    },
    requiredAuth: false,
    enabled: true,
  },
  {
    name: 'file_write',
    description: 'Write content to a file, creating it if it does not exist or overwriting it if it does.',
    category: 'file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file to write',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path', 'content'],
    },
    requiredAuth: false,
    enabled: true,
  },
  {
    name: 'file_list',
    description: 'List the contents of a directory. Returns an array of file and directory names with their types.',
    category: 'file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the directory to list (default: current working directory)',
          default: '.',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list contents recursively (default: false)',
          default: false,
        },
        extensions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional filter by file extensions (e.g., [".ts", ".js"])',
        },
      },
      required: [],
    },
    requiredAuth: false,
    enabled: true,
  },
  {
    name: 'shell_execute',
    description: 'Execute a shell command in the system environment. Commands are validated against a safety whitelist. Dangerous operations (rm -rf, sudo, etc.) are blocked.',
    category: 'shell',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in milliseconds (default: 30000, max: 120000)',
          default: 30000,
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command execution',
        },
      },
      required: ['command'],
    },
    requiredAuth: false,
    enabled: true,
  },
  {
    name: 'web_search',
    description: 'Search the web for information. Returns search results with titles, URLs, and snippets. Requires external search API configuration.',
    category: 'web',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5,
        },
      },
      required: ['query'],
    },
    requiredAuth: true,
    enabled: true,
  },
  {
    name: 'code_analyze',
    description: 'Analyze source code for quality metrics including line counts, complexity indicators, and structural information.',
    category: 'code',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file or directory to analyze',
        },
        includeMetrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['lineCount', 'functionCount', 'complexity', 'imports', 'exports', 'todos'],
          },
          description: 'Which metrics to compute (default: all)',
        },
      },
      required: ['path'],
    },
    requiredAuth: false,
    enabled: true,
  },
  {
    name: 'system_info',
    description: 'Get system information including OS details, CPU, memory, network interfaces, and runtime environment.',
    category: 'system',
    inputSchema: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['os', 'cpu', 'memory', 'network', 'runtime', 'process'],
          },
          description: 'Which system sections to include (default: all)',
        },
      },
      required: [],
    },
    requiredAuth: false,
    enabled: true,
  },
] as const;

// ─── Tool executor type ──────────────────────────────────────────────────────

type ToolExecutor = (params: Record<string, unknown>) => Promise<string>;

const BUILTIN_TOOL_EQUIVALENTS: Readonly<Record<string, readonly string[]>> = {
  file_read: ['read_file'],
  file_write: ['write_file'],
  shell_execute: ['run_command'],
};

// ─── MCP Service ─────────────────────────────────────────────────────────────

export class McpService {
  // Map of built-in tool names to their executor functions
  private readonly executors: Map<string, ToolExecutor> = new Map();

  constructor() {
    this.registerExecutors();
  }

  private registerExecutors(): void {
    this.executors.set('file_read', this.executeFileRead.bind(this));
    this.executors.set('file_write', this.executeFileWrite.bind(this));
    this.executors.set('file_list', this.executeFileList.bind(this));
    this.executors.set('shell_execute', this.executeShellCommand.bind(this));
    this.executors.set('web_search', this.executeWebSearch.bind(this));
    this.executors.set('code_analyze', this.executeCodeAnalyze.bind(this));
    this.executors.set('system_info', this.executeSystemInfo.bind(this));

    // Legacy MCP tool names (kept for compatibility with existing DB/tool configs)
    this.executors.set('read_file', this.executeFileRead.bind(this));
    this.executors.set('write_file', this.executeFileWrite.bind(this));
    this.executors.set('run_command', this.executeShellCommand.bind(this));
    this.executors.set('search_code', this.executeSearchCode.bind(this));
  }

  // ─── Tool Management ─────────────────────────────────────────────────────

  /**
   * List all tools, optionally filtered by agentId, category, or enabled status.
   */
  async listTools(options?: {
    agentId?: string;
    category?: string;
    enabledOnly?: boolean;
  }): Promise<McpToolRecord[]> {
    try {
      const where: Record<string, unknown> = {};

      if (options?.agentId) {
        where.assignments = {
          some: { agentId: options.agentId },
        };
      }

      if (options?.category) {
        where.category = options.category;
      }

      if (options?.enabledOnly) {
        where.enabled = true;
      }

      const tools = await db.mcpTool.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      logger.debug('Listed tools', {
        count: tools.length,
        filters: options,
      });

      return tools as unknown as McpToolRecord[];
    } catch (error) {
      logger.error('Failed to list tools', error as Error, { options });
      throw new Error(`Failed to list tools: ${(error as Error).message}`);
    }
  }

  /**
   * Get a single tool by name.
   */
  async getTool(name: string): Promise<McpToolRecord | null> {
    try {
      const tool = await db.mcpTool.findUnique({
        where: { name },
      });

      if (!tool) {
        logger.debug('Tool not found', { name });
        return null;
      }

      return tool as unknown as McpToolRecord;
    } catch (error) {
      logger.error('Failed to get tool', error as Error, { name });
      throw new Error(`Failed to get tool '${name}': ${(error as Error).message}`);
    }
  }

  /**
   * Register a new tool.
   */
  async registerTool(tool: ToolDefinition): Promise<McpToolRecord> {
    try {
      const inputSchemaStr = typeof tool.inputSchema === 'string'
        ? tool.inputSchema
        : JSON.stringify(tool.inputSchema);

      const created = await db.mcpTool.create({
        data: {
          name: tool.name,
          description: tool.description,
          category: tool.category || 'general',
          inputSchema: inputSchemaStr,
          requiredAuth: tool.requiredAuth ?? false,
          enabled: tool.enabled ?? true,
        },
      });

      logger.info('Registered new tool', { name: tool.name, category: tool.category });
      return created as unknown as McpToolRecord;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        logger.warn('Tool already exists', { name: tool.name });
        throw new Error(`Tool '${tool.name}' already exists`);
      }
      logger.error('Failed to register tool', error as Error, { name: tool.name });
      throw new Error(`Failed to register tool '${tool.name}': ${(error as Error).message}`);
    }
  }

  /**
   * Update an existing tool by name.
   */
  async updateTool(name: string, updates: Partial<ToolDefinition>): Promise<McpToolRecord> {
    try {
      const data: Record<string, unknown> = {};

      if (updates.description !== undefined) data.description = updates.description;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.requiredAuth !== undefined) data.requiredAuth = updates.requiredAuth;
      if (updates.enabled !== undefined) data.enabled = updates.enabled;
      if (updates.inputSchema !== undefined) {
        data.inputSchema = typeof updates.inputSchema === 'string'
          ? updates.inputSchema
          : JSON.stringify(updates.inputSchema);
      }

      const updated = await db.mcpTool.update({
        where: { name },
        data,
      });

      logger.info('Updated tool', { name, fields: Object.keys(data) });
      return updated as unknown as McpToolRecord;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        logger.warn('Tool not found for update', { name });
        throw new Error(`Tool '${name}' not found`);
      }
      logger.error('Failed to update tool', error as Error, { name });
      throw new Error(`Failed to update tool '${name}': ${(error as Error).message}`);
    }
  }

  /**
   * Delete a tool by name. Returns true if deleted, false if not found.
   */
  async deleteTool(name: string): Promise<boolean> {
    try {
      await db.mcpTool.delete({
        where: { name },
      });

      logger.info('Deleted tool', { name });
      return true;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        logger.warn('Tool not found for deletion', { name });
        return false;
      }
      logger.error('Failed to delete tool', error as Error, { name });
      throw new Error(`Failed to delete tool '${name}': ${(error as Error).message}`);
    }
  }

  // ─── Agent-Tool Assignments ─────────────────────────────────────────────

  /**
   * Assign a tool to an agent. Creates the assignment if it does not exist.
   */
  async assignTool(agentId: string, toolName: string): Promise<AgentToolAssignmentRecord> {
    try {
      const tool = await db.mcpTool.findUnique({ where: { name: toolName } });
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`);
      }

      const assignment = await db.agentToolAssignment.create({
        data: {
          agentId,
          toolId: tool.id,
        },
      });

      logger.info('Assigned tool to agent', { agentId, toolName });
      return assignment as unknown as AgentToolAssignmentRecord;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        logger.warn('Tool already assigned to agent', { agentId, toolName });
        throw new Error(`Tool '${toolName}' is already assigned to agent '${agentId}'`);
      }
      if (prismaError.code === 'P2003') {
        throw new Error(`Agent '${agentId}' not found`);
      }
      logger.error('Failed to assign tool', error as Error, { agentId, toolName });
      throw new Error(`Failed to assign tool: ${(error as Error).message}`);
    }
  }

  /**
   * Remove a tool assignment from an agent. Returns true if removed.
   */
  async unassignTool(agentId: string, toolName: string): Promise<boolean> {
    try {
      const tool = await db.mcpTool.findUnique({ where: { name: toolName } });
      if (!tool) {
        logger.warn('Cannot unassign: tool not found', { toolName });
        return false;
      }

      await db.agentToolAssignment.deleteMany({
        where: {
          agentId,
          toolId: tool.id,
        },
      });

      logger.info('Unassigned tool from agent', { agentId, toolName });
      return true;
    } catch (error) {
      logger.error('Failed to unassign tool', error as Error, { agentId, toolName });
      throw new Error(`Failed to unassign tool: ${(error as Error).message}`);
    }
  }

  /**
   * Get all tools assigned to a specific agent.
   */
  async getAgentTools(agentId: string): Promise<McpToolRecord[]> {
    try {
      const assignments = await db.agentToolAssignment.findMany({
        where: { agentId },
        include: {
          tool: true,
        },
        orderBy: { assignedAt: 'asc' },
      });

      const tools = assignments.map((a) => a.tool);
      logger.debug('Retrieved agent tools', { agentId, count: tools.length });
      return tools as unknown as McpToolRecord[];
    } catch (error) {
      logger.error('Failed to get agent tools', error as Error, { agentId });
      throw new Error(`Failed to get tools for agent '${agentId}': ${(error as Error).message}`);
    }
  }

  // ─── Tool Execution ─────────────────────────────────────────────────────

  /**
   * Execute a tool. Validates input, runs the executor, and logs the execution.
   */
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    // Look up the tool
    let tool: { id: string; name: string; enabled: boolean; requiredAuth: boolean; description: string } | null = null;
    try {
      tool = await db.mcpTool.findUnique({
        where: { name: request.toolName },
        select: { id: true, name: true, enabled: true, requiredAuth: true, description: true },
      });
    } catch (error) {
      logger.error('Database error looking up tool', error as Error, { toolName: request.toolName });
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`,
        executionMs: Date.now() - startTime,
        toolName: request.toolName,
      };
    }

    if (!tool) {
      const executionMs = Date.now() - startTime;
      logger.warn('Execution failed: tool not found', { toolName: request.toolName });
      return {
        success: false,
        error: `Tool '${request.toolName}' is not registered`,
        executionMs,
        toolName: request.toolName,
      };
    }

    if (!tool.enabled) {
      const executionMs = Date.now() - startTime;
      logger.warn('Execution failed: tool disabled', { toolName: request.toolName });
      return {
        success: false,
        error: `Tool '${request.toolName}' is currently disabled`,
        executionMs,
        toolName: request.toolName,
      };
    }

    // NEW: Security Check - Verify Agent Assignment
    if (request.agentId) {
      const assignment = await db.agentToolAssignment.findUnique({
        where: {
          agentId_toolId: {
            agentId: request.agentId,
            toolId: tool.id,
          },
        },
      });

      if (!assignment) {
        const executionMs = Date.now() - startTime;
        const errMsg = `Security Violation: Agent '${request.agentId}' is not authorized to use tool '${request.toolName}'`;
        logger.error('Unauthorized tool access attempt', { agentId: request.agentId, toolName: request.toolName });
        
        await this.logExecution({
          toolId: tool.id,
          agentId: request.agentId,
          sessionId: request.sessionId,
          input: request.input,
          output: null,
          status: 'error',
          errorMessage: errMsg,
          executionMs,
        });

        return {
          success: false,
          error: errMsg,
          executionMs,
          toolName: request.toolName,
        };
      }
    }

    // Check for executor
    const executor = this.executors.get(request.toolName);
    if (!executor) {
      const executionMs = Date.now() - startTime;
      const errMsg = `No executor registered for tool '${request.toolName}'. This tool may be a custom tool that requires a custom handler.`;
      logger.warn('No executor for tool', { toolName: request.toolName });

      // Log the failed execution
      await this.logExecution({
        toolId: tool.id,
        agentId: request.agentId,
        sessionId: request.sessionId,
        input: request.input,
        output: null,
        status: 'error',
        errorMessage: errMsg,
        executionMs,
      });

      return {
        success: false,
        error: errMsg,
        executionMs,
        toolName: request.toolName,
      };
    }

    // Execute
    const params = (typeof request.input === 'object' && request.input !== null)
      ? request.input as Record<string, unknown>
      : {};

    try {
      logger.info('Executing tool', { toolName: request.toolName, agentId: request.agentId });

      const output = await executor(params);
      const executionMs = Date.now() - startTime;

      await this.logExecution({
        toolId: tool.id,
        agentId: request.agentId,
        sessionId: request.sessionId,
        input: request.input,
        output,
        status: 'success',
        errorMessage: null,
        executionMs,
      });

      logger.info('Tool execution succeeded', {
        toolName: request.toolName,
        executionMs,
        outputLength: output.length,
      });

      return {
        success: true,
        output,
        executionMs,
        toolName: request.toolName,
      };
    } catch (error) {
      const executionMs = Date.now() - startTime;
      const errorMsg = (error as Error).message;

      await this.logExecution({
        toolId: tool.id,
        agentId: request.agentId,
        sessionId: request.sessionId,
        input: request.input,
        output: null,
        status: 'error',
        errorMessage: errorMsg,
        executionMs,
      });

      logger.error('Tool execution failed', error as Error, {
        toolName: request.toolName,
        executionMs,
      });

      return {
        success: false,
        error: errorMsg,
        executionMs,
        toolName: request.toolName,
      };
    }
  }

  /**
   * Get execution logs with optional filters and pagination.
   */
  async getExecutionLogs(options?: {
    toolId?: string;
    agentId?: string;
    sessionId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ToolExecutionLogRecord[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};
      if (options?.toolId) where.toolId = options.toolId;
      if (options?.agentId) where.agentId = options.agentId;
      if (options?.sessionId) where.sessionId = options.sessionId;
      if (options?.status) where.status = options.status;

      const limit = Math.min(options?.limit ?? 50, 200);
      const offset = Math.max(options?.offset ?? 0, 0);

      const [logs, total] = await Promise.all([
        db.toolExecutionLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.toolExecutionLog.count({ where }),
      ]);

      logger.debug('Retrieved execution logs', { total, limit, offset, filters: options });
      return {
        logs: logs as unknown as ToolExecutionLogRecord[],
        total,
      };
    } catch (error) {
      logger.error('Failed to get execution logs', error as Error);
      throw new Error(`Failed to get execution logs: ${(error as Error).message}`);
    }
  }

  /**
   * Get tool usage statistics summary.
   */
  async getToolStats(): Promise<{
    totalTools: number;
    enabledTools: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionMs: number;
    byCategory: Record<string, { count: number; successRate: number }>;
    topTools: Array<{ name: string; executions: number; successRate: number }>;
  }> {
    try {
      const [totalTools, enabledTools, allLogs, categoryBreakdown] = await Promise.all([
        db.mcpTool.count(),
        db.mcpTool.count({ where: { enabled: true } }),
        db.toolExecutionLog.findMany({ select: { status: true, executionMs: true, toolId: true } }),
        db.mcpTool.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
      ]);

      const totalExecutions = allLogs.length;
      const successCount = allLogs.filter((l) => l.status === 'success').length;
      const successRate = totalExecutions > 0 ? successCount / totalExecutions : 0;

      const executionsWithMs = allLogs.filter((l) => l.executionMs !== null);
      const avgExecutionMs = executionsWithMs.length > 0
        ? Math.round(executionsWithMs.reduce((sum, l) => sum + (l.executionMs ?? 0), 0) / executionsWithMs.length)
        : 0;

      // Build category stats
      const byCategory: Record<string, { count: number; successRate: number }> = {};
      for (const cat of categoryBreakdown) {
        byCategory[cat.category] = { count: cat._count.id, successRate: 0 };
      }

      // Compute per-category success rate from logs
      const toolIds = [...new Set(allLogs.map((l) => l.toolId))];
      const tools = await db.mcpTool.findMany({
        where: { id: { in: toolIds } },
        select: { id: true, name: true, category: true },
      });
      const toolMap = new Map(tools.map((t) => [t.id, t]));

      const categorySuccess: Record<string, { total: number; success: number }> = {};
      for (const log of allLogs) {
        const tool = toolMap.get(log.toolId);
        if (!tool) continue;
        if (!categorySuccess[tool.category]) {
          categorySuccess[tool.category] = { total: 0, success: 0 };
        }
        categorySuccess[tool.category].total++;
        if (log.status === 'success') {
          categorySuccess[tool.category].success++;
        }
      }
      for (const [cat, stats] of Object.entries(categorySuccess)) {
        if (byCategory[cat]) {
          byCategory[cat].successRate = stats.total > 0 ? stats.success / stats.total : 0;
        }
      }

      // Top tools by execution count
      const toolExecCounts: Record<string, { total: number; success: number }> = {};
      for (const log of allLogs) {
        if (!toolExecCounts[log.toolId]) {
          toolExecCounts[log.toolId] = { total: 0, success: 0 };
        }
        toolExecCounts[log.toolId].total++;
        if (log.status === 'success') {
          toolExecCounts[log.toolId].success++;
        }
      }

      const topTools = Object.entries(toolExecCounts)
        .map(([toolId, stats]) => {
          const tool = toolMap.get(toolId);
          return {
            name: tool?.name ?? toolId,
            executions: stats.total,
            successRate: stats.total > 0 ? stats.success / stats.total : 0,
          };
        })
        .sort((a, b) => b.executions - a.executions)
        .slice(0, 10);

      logger.debug('Computed tool stats', {
        totalTools,
        enabledTools,
        totalExecutions,
        successRate,
      });

      return {
        totalTools,
        enabledTools,
        totalExecutions,
        successRate,
        avgExecutionMs,
        byCategory,
        topTools,
      };
    } catch (error) {
      logger.error('Failed to compute tool stats', error as Error);
      throw new Error(`Failed to get tool stats: ${(error as Error).message}`);
    }
  }

  // ─── Editor Configuration ──────────────────────────────────────────────

  /**
   * Generate MCP editor configuration for various editors.
   */
  async getEditorConfig(workspace?: string): Promise<{
    vscode: Record<string, unknown>;
    qoder: Record<string, unknown>;
    universal: Record<string, unknown>;
  }> {
    const tools = await db.mcpTool.findMany({
      where: { enabled: true },
      select: { name: true, description: true, inputSchema: true, category: true },
      orderBy: { name: 'asc' },
    });

    const toolList = tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: JSON.parse(t.inputSchema),
      category: t.category,
    }));

    const resolvedWorkspace = workspace || process.cwd();
    const enabledToolNames = new Set(tools.map((t) => t.name));

    const autoApprove: string[] = [];
    if (enabledToolNames.has('file_read')) autoApprove.push('file_read');
    else if (enabledToolNames.has('read_file')) autoApprove.push('read_file');
    if (enabledToolNames.has('file_list')) autoApprove.push('file_list');
    if (enabledToolNames.has('system_info')) autoApprove.push('system_info');

    const requireConfirmation: string[] = [];
    if (enabledToolNames.has('file_write')) requireConfirmation.push('file_write');
    else if (enabledToolNames.has('write_file')) requireConfirmation.push('write_file');
    if (enabledToolNames.has('shell_execute')) requireConfirmation.push('shell_execute');
    else if (enabledToolNames.has('run_command')) requireConfirmation.push('run_command');
    if (enabledToolNames.has('web_search')) requireConfirmation.push('web_search');

    const vscode: Record<string, unknown> = {
      version: '0.1.0',
      tools: toolList,
      server: {
        name: 'zombiecoder-mcp',
        version: '1.0.0',
        workspace: resolvedWorkspace,
      },
      settings: {
        autoApprove,
        requireConfirmation,
        blocked: [],
      },
    };

    const qoder: Record<string, unknown> = {
      mcpVersion: '2025-03-26',
      protocolVersion: '1.0',
      serverInfo: {
        name: 'zombiecoder-mcp',
        version: '1.0.0',
      },
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      tools: toolList.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      workspace: resolvedWorkspace,
    };

    const universal: Record<string, unknown> = {
      mcpServer: {
        name: 'zombiecoder-mcp',
        version: '1.0.0',
        transport: 'stdio',
      },
      workspace: resolvedWorkspace,
      tools: toolList,
      categories: [...new Set(tools.map((t) => t.category))],
    };

    logger.info('Generated editor configuration', {
      toolCount: tools.length,
      workspace: resolvedWorkspace,
    });

    return { vscode, qoder, universal };
  }

  // ─── Built-in Tool Seeding ─────────────────────────────────────────────

  /**
   * Seed built-in tools into the database if they don't already exist.
   */
  async seedBuiltinTools(): Promise<void> {
    let created = 0;
    let skipped = 0;

    for (const toolDef of BUILTIN_TOOLS) {
      try {
        const equivalents = BUILTIN_TOOL_EQUIVALENTS[toolDef.name] ?? [];
        const namesToCheck = [toolDef.name, ...equivalents];

        const existing = await db.mcpTool.findFirst({
          where: { name: { in: namesToCheck } },
          select: { name: true },
        });

        if (existing) {
          skipped++;
          logger.debug('Builtin tool already exists, skipping', { name: toolDef.name, existingName: existing.name });
          continue;
        }

        await db.mcpTool.create({
          data: {
            name: toolDef.name,
            description: toolDef.description,
            category: toolDef.category,
            inputSchema: JSON.stringify(toolDef.inputSchema),
            requiredAuth: toolDef.requiredAuth,
            enabled: toolDef.enabled,
          },
        });

        created++;
        logger.info('Seeded builtin tool', { name: toolDef.name, category: toolDef.category });
      } catch (error) {
        logger.error('Failed to seed builtin tool', error as Error, { name: toolDef.name });
      }
    }

    logger.info('Builtin tool seeding complete', { created, skipped, total: BUILTIN_TOOLS.length });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────

  /**
   * Persist an execution log entry to the database.
   */
  private async logExecution(params: {
    toolId: string;
    agentId?: string;
    sessionId?: string;
    input: unknown;
    output: string | null;
    status: string;
    errorMessage: string | null;
    executionMs: number;
  }): Promise<void> {
    try {
      await db.toolExecutionLog.create({
        data: {
          toolId: params.toolId,
          agentId: params.agentId ?? null,
          sessionId: params.sessionId ?? null,
          inputParams: JSON.stringify(params.input),
          outputResult: params.output,
          status: params.status,
          errorMessage: params.errorMessage,
          executionMs: params.executionMs,
        },
      });
    } catch (logError) {
      // Don't let logging failures propagate — log to stderr instead
      logger.error('Failed to persist execution log', logError as Error, {
        toolId: params.toolId,
        status: params.status,
      });
    }
  }

  // ─── Built-in Tool Executors (Real Implementations) ────────────────────

  /**
   * file_read: Read file contents from disk.
   */
  private async executeFileRead(params: Record<string, unknown>): Promise<string> {
    const filePath = params.path as string;
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Missing or invalid "path" parameter');
    }

    const encoding = (params.encoding as BufferEncoding) ?? 'utf-8';
    const resolved = path.resolve(filePath);

    logger.debug('Reading file', { path: resolved, encoding });

    try {
      const stat = await fs.stat(resolved);
      if (stat.size > 10 * 1024 * 1024) {
        throw new Error(`File too large: ${(stat.size / 1024 / 1024).toFixed(2)}MB exceeds 10MB limit`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${resolved}`);
      }
      throw error;
    }

    const content = await fs.readFile(resolved, encoding);
    return content;
  }

  /**
   * file_write: Write content to a file on disk.
   */
  private async executeFileWrite(params: Record<string, unknown>): Promise<string> {
    const filePath = params.path as string;
    const content = params.content as string;

    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Missing or invalid "path" parameter');
    }
    if (content === undefined || content === null) {
      throw new Error('Missing "content" parameter');
    }

    const encoding = (params.encoding as BufferEncoding) ?? 'utf-8';
    const resolved = path.resolve(filePath);

    logger.debug('Writing file', { path: resolved, encoding, contentLength: String(content).length });

    // Ensure parent directory exists
    const dir = path.dirname(resolved);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(resolved, String(content), encoding);

    return `Successfully wrote ${(String(content).length)} bytes to ${resolved}`;
  }

  /**
   * file_list: List directory contents.
   */
  private async executeFileList(params: Record<string, unknown>): Promise<string> {
    const dirPath = params.path as string ?? '.';
    const recursive = params.recursive as boolean ?? false;
    const extensions = params.extensions as string[] | undefined;

    const resolved = path.resolve(dirPath);

    logger.debug('Listing directory', { path: resolved, recursive });

    const entries = await this.listDirectory(resolved, recursive, extensions);

    return JSON.stringify({
      path: resolved,
      count: entries.length,
      entries,
    }, null, 2);
  }

  /**
   * Recursively list directory entries with filtering.
   */
  private async listDirectory(
    dirPath: string,
    recursive: boolean,
    extensions?: string[],
  ): Promise<Array<{ name: string; path: string; type: 'file' | 'directory'; size?: number }>> {
    const entries: Array<{ name: string; path: string; type: 'file' | 'directory'; size?: number }> = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      // Skip hidden files/directories
      if (item.name.startsWith('.') && item.name !== '.env.example') {
        continue;
      }

      const fullPath = path.join(dirPath, item.name);

      // Apply extension filter for files
      if (item.isFile() && extensions && extensions.length > 0) {
        const ext = path.extname(item.name);
        if (!extensions.includes(ext) && !extensions.includes(ext.toLowerCase())) {
          continue;
        }
      }

      if (item.isFile()) {
        try {
          const stat = await fs.stat(fullPath);
          entries.push({
            name: item.name,
            path: fullPath,
            type: 'file',
            size: stat.size,
          });
        } catch {
          entries.push({
            name: item.name,
            path: fullPath,
            type: 'file',
          });
        }
      } else if (item.isDirectory()) {
        entries.push({
          name: item.name,
          path: fullPath,
          type: 'directory',
        });

        if (recursive) {
          try {
            const subEntries = await this.listDirectory(fullPath, true, extensions);
            entries.push(...subEntries);
          } catch {
            // Skip directories we can't read (permission errors, etc.)
          }
        }
      }
    }

    return entries;
  }

  /**
   * shell_execute: Execute a whitelisted shell command.
   */
  private async executeShellCommand(params: Record<string, unknown>): Promise<string> {
    const command = params.command as string;
    if (!command || typeof command !== 'string') {
      throw new Error('Missing or invalid "command" parameter');
    }

    if (!isShellCommandAllowed(command)) {
      logger.warn('Shell command blocked by whitelist', { command });
      throw new Error(
        `Command not allowed by security whitelist. Blocked: "${command.trim().split(/\s+/)[0]}". ` +
        `Allowed commands: ${[...SHELL_WHITELIST].slice(0, 10).join(', ')}, and more.`
      );
    }

    const timeoutMs = Math.min(
      Math.max((params.timeout as number) ?? 30000, 1000),
      120000,
    );
    const cwd = params.cwd as string | undefined;

    logger.info('Executing shell command', { command, timeoutMs, cwd });

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeoutMs,
        cwd: cwd || process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: { ...process.env },
      });

      const output = stderr.trim() ? `${stdout.trim()}\n[stderr] ${stderr.trim()}` : stdout.trim();
      return output || '(command produced no output)';
    } catch (error) {
      const execError = error as { message?: string; stderr?: string; code?: number; killed?: boolean };
      if (execError.killed) {
        throw new Error(`Command timed out after ${timeoutMs}ms: ${command}`);
      }
      const errorMsg = execError.stderr?.trim() || execError.message || 'Unknown execution error';
      throw new Error(`Command failed: ${errorMsg}`);
    }
  }

  /**
   * search_code: Search within the project workspace for a query string/regex.
   * Uses ripgrep (`rg`) when available, with a safe fallback for environments without it.
   */
  private async executeSearchCode(params: Record<string, unknown>): Promise<string> {
    const query = params.query as string;
    if (!query || typeof query !== 'string') {
      throw new Error('Missing or invalid "query" parameter');
    }

    const searchPath = (params.path as string | undefined) ?? '.';
    const limitRaw = params.limit as number | undefined;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Number(limitRaw), 1), 500) : 50;

    const resolvedRoot = path.resolve(searchPath);

    logger.info('Searching code', { query, path: resolvedRoot, limit });

    // Preferred: ripgrep
    try {
      const { stdout } = await execFileAsync('rg', [
        '--line-number',
        '--column',
        '--no-heading',
        '--color',
        'never',
        '--max-count',
        String(limit),
        query,
        resolvedRoot,
      ], {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      });

      const matches = stdout
        .split('\n')
        .map((l) => l.trimEnd())
        .filter(Boolean)
        .map((line) => {
          // Format: file:line:column:match
          const first = line.indexOf(':');
          const second = first >= 0 ? line.indexOf(':', first + 1) : -1;
          const third = second >= 0 ? line.indexOf(':', second + 1) : -1;
          if (first < 0 || second < 0 || third < 0) {
            return { raw: line };
          }
          const file = line.slice(0, first);
          const lineNum = Number(line.slice(first + 1, second));
          const colNum = Number(line.slice(second + 1, third));
          const preview = line.slice(third + 1);
          return {
            file,
            line: Number.isFinite(lineNum) ? lineNum : null,
            column: Number.isFinite(colNum) ? colNum : null,
            preview,
          };
        });

      return JSON.stringify({
        query,
        path: resolvedRoot,
        count: matches.length,
        matches,
        engine: 'rg',
      }, null, 2);
    } catch (error) {
      const err = error as NodeJS.ErrnoException & { code?: number; stderr?: string };

      // `rg` exit code 1 means "no matches"
      if (typeof err.code === 'number' && err.code === 1) {
        return JSON.stringify({
          query,
          path: resolvedRoot,
          count: 0,
          matches: [],
          engine: 'rg',
        }, null, 2);
      }

      // If `rg` isn't available, fall back to a simple substring scan.
      if (err.code === 'ENOENT') {
        logger.warn('ripgrep (rg) not found, using fallback search', { query, path: resolvedRoot });
      } else {
        logger.warn('ripgrep search failed, using fallback search', { query, path: resolvedRoot, error: err.message });
      }
    }

    // Fallback: naive scan for substring matches in common code/text extensions.
    const extensions = [
      '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
      '.json', '.md', '.prisma', '.sql', '.yml', '.yaml',
      '.txt', '.env', '.env.example',
    ];

    const entries = await this.listDirectory(resolvedRoot, true, extensions);
    const files = entries.filter((e) => e.type === 'file').slice(0, 5000);

    const matches: Array<{ file: string; line: number; column: number; preview: string }> = [];
    for (const fileEntry of files) {
      if (matches.length >= limit) break;
      try {
        const content = await fs.readFile(fileEntry.path, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (matches.length >= limit) break;
          const idx = lines[i].indexOf(query);
          if (idx !== -1) {
            matches.push({
              file: fileEntry.path,
              line: i + 1,
              column: idx + 1,
              preview: lines[i].slice(0, 500),
            });
          }
        }
      } catch {
        // Skip unreadable/binary files
      }
    }

    return JSON.stringify({
      query,
      path: resolvedRoot,
      count: matches.length,
      matches,
      engine: 'fallback',
      note: 'Fallback uses simple substring matching (not regex).',
    }, null, 2);
  }

  /**
   * web_search: Placeholder that requires external API configuration.
   * Returns a clear error indicating configuration is needed.
   */
  private async executeWebSearch(params: Record<string, unknown>): Promise<string> {
    const query = params.query as string;
    if (!query || typeof query !== 'string') {
      throw new Error('Missing or invalid "query" parameter');
    }

    // Check if a web search API is configured
    const searchApiKey = process.env.SEARCH_API_KEY;
    const searchEndpoint = process.env.SEARCH_API_ENDPOINT;

    if (!searchApiKey || !searchEndpoint) {
      throw new Error(
        'Web search is not configured. Set SEARCH_API_ENDPOINT and SEARCH_API_KEY environment variables to enable web search functionality.'
      );
    }

    const limit = Math.min(Math.max((params.limit as number) ?? 5, 1), 20);

    logger.info('Executing web search', { query, limit, endpoint: searchEndpoint });

    try {
      // Attempt to call the search API
      const searchUrl = new URL(searchEndpoint);
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('count', String(limit));

      const response = await fetch(searchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${searchApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Search API returned ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = await response.json() as Record<string, unknown>;
      return JSON.stringify(data, null, 2);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Web search timed out after 30s');
      }
      throw error;
    }
  }

  /**
   * code_analyze: Analyze source code for quality metrics.
   */
  private async executeCodeAnalyze(params: Record<string, unknown>): Promise<string> {
    const targetPath = params.path as string;
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Missing or invalid "path" parameter');
    }

    const includeMetrics = params.includeMetrics as string[] ?? [
      'lineCount', 'functionCount', 'complexity', 'imports', 'exports', 'todos',
    ];

    const resolved = path.resolve(targetPath);
    const stat = await fs.stat(resolved);

    if (stat.isFile()) {
      return await this.analyzeFile(resolved, includeMetrics);
    } else if (stat.isDirectory()) {
      return await this.analyzeDirectory(resolved, includeMetrics);
    } else {
      throw new Error(`Path is neither a file nor a directory: ${resolved}`);
    }
  }

  /**
   * Analyze a single file for code metrics.
   */
  private async analyzeFile(filePath: string, metrics: string[]): Promise<string> {
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const result: Record<string, unknown> = {
      path: filePath,
      extension: ext,
    };

    if (metrics.includes('lineCount')) {
      const codeLines = lines.filter((l) => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('#')).length;
      const commentLines = lines.filter((l) => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('#')).length;
      const blankLines = lines.filter((l) => l.trim().length === 0).length;

      result.lineCount = {
        total: lines.length,
        code: codeLines,
        comments: commentLines,
        blank: blankLines,
        size: Buffer.byteLength(content, 'utf-8'),
      };
    }

    if (metrics.includes('functionCount')) {
      const functionPatterns = [
        /(?:export\s+)?(?:async\s+)?function\s+\w+/g,
        /(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(/g,
        /(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/g,
        /class\s+\w+/g,
        /interface\s+\w+/g,
        /type\s+\w+\s*=/g,
        /def\s+\w+/g,
        /fn\s+\w+/g,
        /func\s+\w+/g,
      ];

      const allMatches: string[] = [];
      for (const pattern of functionPatterns) {
        const matches = content.match(pattern);
        if (matches) allMatches.push(...matches);
      }

      result.functionCount = allMatches.length;
      result.declarations = allMatches.map((m) => m.replace(/^export\s+/, '').replace(/\s*=\s*.*$/, '').trim());
    }

    if (metrics.includes('imports')) {
      const importPatterns = [
        /import\s+.*?from\s+['"].*?['"]/g,
        /require\s*\(['"].*?['"]\)/g,
        /from\s+['"].*?['"]\s+import/g,
        /#include\s+<.*?>/g,
      ];

      const imports: string[] = [];
      for (const pattern of importPatterns) {
        const matches = content.match(pattern);
        if (matches) imports.push(...matches.map((m) => m.trim()));
      }
      result.imports = imports;
      result.importCount = imports.length;
    }

    if (metrics.includes('exports')) {
      const exportPattern = /export\s+(?:default\s+)?(?:const|let|var|function|class|async\s+function|interface|type)\s+\w+/g;
      const exportMatches = content.match(exportPattern);
      const exportList = exportMatches?.map((m) => m.trim()) ?? [];
      result.exports = exportList;
      result.exportCount = exportList.length;
    }

    if (metrics.includes('todos')) {
      const todoPattern = /(?:TODO|FIXME|HACK|XXX|NOTE|BUG)(?::|\s).*$/gim;
      const todoMatches = content.match(todoPattern);
      const todoList = todoMatches?.map((m) => m.trim()) ?? [];
      result.todos = todoList;
      result.todoCount = todoList.length;
    }

    if (metrics.includes('complexity')) {
      // Simple heuristic: count branching keywords
      const branchPatterns = [
        /if\s*\(/g,
        /else\s+if\s*\(/g,
        /else\s*{/g,
        /for\s*\(/g,
        /while\s*\(/g,
        /case\s+/g,
        /\?\?/g,
        /\?\./g,
        /\.map\s*\(/g,
        /\.filter\s*\(/g,
        /\.reduce\s*\(/g,
        /&&/g,
        /\|\|/g,
        /\?\s*[^.?]/g,
        /try\s*{/g,
        /catch\s*\(/g,
      ];

      let branchCount = 0;
      for (const pattern of branchPatterns) {
        const matches = content.match(pattern);
        if (matches) branchCount += matches.length;
      }

      result.complexity = {
        estimatedBranchCount: branchCount,
        level: branchCount > 100 ? 'high' : branchCount > 30 ? 'medium' : 'low',
      };
    }

    return JSON.stringify(result, null, 2);
  }

  /**
   * Analyze all source files in a directory.
   */
  private async analyzeDirectory(dirPath: string, metrics: string[]): Promise<string> {
    const entries = await this.listDirectory(dirPath, true, undefined);
    const files = entries.filter((e) => e.type === 'file');
    const codeExtensions = new Set([
      '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
      '.py', '.rs', '.go', '.java', '.kt', '.swift',
      '.c', '.cpp', '.h', '.hpp', '.cs', '.rb',
      '.php', '.lua', '.sh', '.bash', '.zsh',
      '.json', '.yaml', '.yml', '.toml',
      '.sql', '.graphql', '.vue', '.svelte',
    ]);

    const codeFiles = files.filter((f) => codeExtensions.has(path.extname(f.name).toLowerCase()));
    const summary = {
      path: dirPath,
      totalFiles: files.length,
      codeFiles: codeFiles.length,
      directories: entries.filter((e) => e.type === 'directory').length,
      totalSize: files.reduce((sum, f) => sum + (f.size ?? 0), 0),
      extensions: [...new Set(codeFiles.map((f) => path.extname(f.name).toLowerCase()))],
      filesByExtension: {} as Record<string, number>,
      largestFiles: files
        .filter((f) => f.size !== undefined)
        .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
        .slice(0, 10)
        .map((f) => ({ name: f.name, size: f.size })),
    };

    for (const file of codeFiles) {
      const ext = path.extname(file.name).toLowerCase();
      summary.filesByExtension[ext] = (summary.filesByExtension[ext] ?? 0) + 1;
    }

    // Analyze up to 50 files to prevent excessive work
    const filesToAnalyze = codeFiles.slice(0, 50);
    const fileAnalyses: Array<Record<string, unknown>> = [];

    for (const file of filesToAnalyze) {
      try {
        const analysis = await this.analyzeFile(file.path, metrics);
        fileAnalyses.push(JSON.parse(analysis));
      } catch {
        fileAnalyses.push({ path: file.path, error: 'Could not analyze file' });
      }
    }

    // Aggregate line counts
    let totalLines = 0;
    let totalCodeLines = 0;
    let totalTodos = 0;
    for (const analysis of fileAnalyses) {
      const lc = analysis.lineCount as Record<string, number> | undefined;
      if (lc) {
        totalLines += lc.total ?? 0;
        totalCodeLines += lc.code ?? 0;
      }
      totalTodos += (analysis.todoCount as number) ?? 0;
    }

    return JSON.stringify({
      ...summary,
      aggregated: {
        totalLines,
        totalCodeLines,
        totalTodos,
        filesAnalyzed: filesToAnalyze.length,
        filesSkipped: Math.max(0, codeFiles.length - 50),
      },
      fileDetails: fileAnalyses,
    }, null, 2);
  }

  /**
   * system_info: Gather real system information using the os module.
   */
  private async executeSystemInfo(params: Record<string, unknown>): Promise<string> {
    const sections = params.sections as string[] ?? ['os', 'cpu', 'memory', 'network', 'runtime', 'process'];

    const result: Record<string, unknown> = {};

    if (sections.includes('os')) {
      result.os = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        version: os.version(),
        hostname: os.hostname(),
        type: os.type(),
        machine: os.machine(),
        homedir: os.homedir(),
        tmpdir: os.tmpdir(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        uptime: os.uptime(),
        endianness: os.endianness(),
      };
    }

    if (sections.includes('cpu')) {
      const cpus = os.cpus();
      result.cpu = {
        model: cpus[0]?.model ?? 'unknown',
        cores: cpus.length,
        speed: cpus[0]?.speed ?? 0,
        architecture: os.arch(),
        processors: cpus.map((c) => ({
          model: c.model,
          speed: c.speed,
          cores: (c as unknown as Record<string, unknown>).cores as number ?? 1,
        })),
      };
    }

    if (sections.includes('memory')) {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      result.memory = {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        totalHuman: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeHuman: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usedHuman: `${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100 * 100) / 100,
      };
    }

    if (sections.includes('network')) {
      const interfaces = os.networkInterfaces();
      const networkInfo: Array<{ name: string; type: string; address: string; mac?: string }> = [];
      for (const [name, nets] of Object.entries(interfaces)) {
        if (!nets) continue;
        for (const net of nets) {
          if (net.family === 'IPv4' && !net.internal) {
            networkInfo.push({
              name,
              type: net.family,
              address: net.address,
              mac: net.mac,
            });
          }
        }
      }
      result.network = {
        hostname: os.hostname(),
        interfaces: networkInfo,
      };
    }

    if (sections.includes('runtime')) {
      result.runtime = {
        nodeVersion: process.version,
        v8Version: process.versions.v8,
        uvVersion: process.versions.uv,
        opensslVersion: process.versions.openssl,
        execPath: process.execPath,
        platform: process.platform,
        pid: process.pid,
        argv: process.argv.slice(0, 3),
        env: {
          NODE_ENV: process.env.NODE_ENV ?? 'not set',
          DATABASE_URL: process.env.DATABASE_URL ? '(configured)' : '(not set)',
          HOME: process.env.HOME ?? 'unknown',
        },
      };
    }

    if (sections.includes('process')) {
      const memUsage = process.memoryUsage();
      result.process = {
        pid: process.pid,
        ppid: process.ppid,
        uptime: process.uptime(),
        title: process.title,
        cwd: process.cwd(),
        memoryUsage: {
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
          arrayBuffers: `${(memUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
        },
      };
    }

    return JSON.stringify(result, null, 2);
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const mcpService = new McpService();
