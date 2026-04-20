"use client";

import React, { useEffect, useState } from "react";
import { createLogger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  Users,
  Cpu,
  Activity,
  ShieldCheck,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const logger = createLogger("editors-page");

interface ClientInfo {
  clientId: string;
  sessionId: string;
  connectedForMs: number;
  lastPingMsAgo: number;
}

interface McpTool {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  requiredAuth: boolean;
  inputSchema: any;
  createdAt: string;
}

interface ToolStats {
  totalTools: number;
  enabledTools: number;
  totalExecutions: number;
  successRate: number;
  avgExecutionMs: number;
  byCategory: Record<string, { count: number; successRate: number }>;
  topTools: Array<{ name: string; executions: number }>;
}

interface TestResult {
  toolName: string;
  status: "success" | "error" | "testing";
  executionMs?: number;
  error?: string;
  output?: any;
}

export default function EditorsDashboard() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [toolStats, setToolStats] = useState<ToolStats | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {},
  );
  const [testingAll, setTestingAll] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/stock/health");
      if (res.ok) {
        setServerStatus("online");
        const clientRes = await fetch("/api/stock/clients");
        if (clientRes.ok) {
          const json = await clientRes.json();
          const payload = (json?.data?.data ?? json?.data ?? json) as any;
          const list = payload?.data?.clients || payload?.clients || [];
          setClients(Array.isArray(list) ? list : []);
        }
      } else {
        setServerStatus("offline");
      }
    } catch (err) {
      setServerStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  const fetchMcpData = async () => {
    try {
      const [toolsRes, statsRes] = await Promise.all([
        fetch("/api/mcp/tools"),
        fetch("/api/mcp/stats"),
      ]);

      if (toolsRes.ok) {
        const toolsJson = await toolsRes.json();
        setTools(toolsJson.data.tools || []);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setToolStats(statsJson.data);
      }
    } catch (err) {
      logger.error("Failed to fetch MCP data", err as Error);
    }
  };

  const testTool = async (toolName: string, input: any = {}) => {
    setTestResults((prev) => ({
      ...prev,
      [toolName]: { toolName, status: "testing" },
    }));

    const startTime = Date.now();
    try {
      const res = await fetch("/api/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName, input }),
      });

      const json = await res.json();
      const executionMs = Date.now() - startTime;

      if (json.success && json.data?.success) {
        setTestResults((prev) => ({
          ...prev,
          [toolName]: {
            toolName,
            status: "success",
            executionMs,
            output: json.data.output,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [toolName]: {
            toolName,
            status: "error",
            executionMs,
            error: json.error || json.data?.error || "Unknown error",
          },
        }));
      }
    } catch (err) {
      const executionMs = Date.now() - startTime;
      setTestResults((prev) => ({
        ...prev,
        [toolName]: {
          toolName,
          status: "error",
          executionMs,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    }
  };

  const testAllTools = async () => {
    setTestingAll(true);
    for (const tool of tools) {
      if (!tool.enabled) continue;

      let testInput = {};
      if (tool.name === "system_info") {
        testInput = { sections: ["os", "runtime"] };
      } else if (tool.name === "file_list") {
        testInput = { path: "." };
      } else if (tool.name === "file_read" || tool.name === "read_file") {
        testInput = { path: "package.json" };
      } else if (tool.name === "search_code") {
        testInput = { query: "mcpService" };
      }

      await testTool(tool.name, testInput);
    }
    setTestingAll(false);
  };

  useEffect(() => {
    fetchStatus();
    fetchMcpData();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#03060a] text-[#c9d1d9] p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
            >
              ZombieCoder Editors Hub
            </motion.h1>
            <p className="text-muted-foreground mt-2 italic text-sm">
              মাসুদ ফোরেনসিক ড্যাশবোর্ড | রিয়েল-টাইম এডিটর ট্র্যাকিং
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={serverStatus === "online" ? "default" : "destructive"}
              className="px-3 py-1 flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${serverStatus === "online" ? "bg-emerald-400" : "bg-red-400"}`}
              />
              Stock Server: {serverStatus.toUpperCase()}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Active Editors"
            value={clients.length}
            icon={<Users className="text-blue-400" />}
          />
          <StatCard
            title="MCP Tools"
            value={tools.filter((t) => t.enabled).length}
            icon={<Terminal className="text-emerald-400" />}
          />
          <StatCard
            title="Success Rate"
            value={
              toolStats ? `${(toolStats.successRate * 100).toFixed(1)}%` : "N/A"
            }
            icon={<CheckCircle className="text-purple-400" />}
          />
          <StatCard
            title="Avg Execution"
            value={
              toolStats ? `${toolStats.avgExecutionMs.toFixed(0)}ms` : "N/A"
            }
            icon={<Zap className="text-amber-400" />}
          />
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">
              কানেক্টেড এডিটর সেশনসমূহ (Live)
            </h2>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-muted-foreground bg-slate-900/10">
              <p>
                বর্তমানে কোনো এডিটর সেশন সক্রিয় নেই। আপনার VSCode বা Cursor
                কানেক্ট করুন।
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {clients.map((client) => (
                <motion.div
                  key={client.clientId}
                  layoutId={client.clientId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0d1117] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                      <Terminal className="text-blue-400 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-mono text-blue-400">
                        {client.clientId}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Session: {client.sessionId}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Uptime
                      </p>
                      <p className="text-sm font-medium">
                        {(client.connectedForMs / 1000 / 60).toFixed(1)} mins
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Latency
                      </p>
                      <p className="text-sm font-medium text-emerald-400">
                        {client.lastPingMsAgo}ms
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-20 pt-8 border-t border-slate-800/50 text-center text-[11px] text-muted-foreground">
          <p>© 2026 ZombieCoder Empire | Forensic Security Protocol: Active</p>
          <p className="mt-1">
            "বিশ্বাসে ছোট মাছের ঝোল আর শাকে মাসুদ আপনার সাথে আছে।"
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-[#0d1117] border-slate-800 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-none">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-100 leading-none">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
