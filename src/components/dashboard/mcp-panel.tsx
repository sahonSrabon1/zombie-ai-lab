"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Wrench,
  RefreshCw,
  BarChart3,
  FileText,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Code2,
  Globe,
  Search,
  Cpu,
  Settings,
} from "lucide-react";

interface ToolItem {
  name: string;
  description?: string;
  category?: string;
  enabled?: boolean;
  requiredAuth?: boolean;
  [key: string]: unknown;
}

interface ExecutionLog {
  id?: string;
  toolName?: string;
  status?: string;
  duration?: number;
  timestamp?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  agentId?: string;
  [key: string]: unknown;
}

interface ToolStats {
  totalTools?: number;
  enabledTools?: number;
  totalExecutions?: number;
  successRate?: number;
  avgLatency?: number;
  categoryBreakdown?: Record<string, number>;
  topTools?: Array<{ name: string; count: number; successRate?: number }>;
}

const categoryIcons: Record<string, React.ElementType> = {
  file: FileText,
  shell: Terminal,
  web: Globe,
  search: Search,
  code: Code2,
  system: Cpu,
  general: Settings,
};

const categoryColors: Record<string, string> = {
  file: "text-emerald-400 bg-emerald-500/15",
  shell: "text-amber-400 bg-amber-500/15",
  web: "text-cyan-400 bg-cyan-500/15",
  search: "text-purple-400 bg-purple-500/15",
  code: "text-pink-400 bg-pink-500/15",
  system: "text-blue-400 bg-blue-500/15",
  general: "text-zinc-400 bg-zinc-500/15",
};

export function McpPanel() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [clients, setClients] = useState<Array<{ clientId: string; sessionId: string; connectedForMs: number; lastPingMsAgo: number }>>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [toolsRes, logsRes, statsRes] = await Promise.allSettled([
        fetch("/api/mcp/tools"),
        fetch("/api/mcp/logs"),
        fetch("/api/mcp/stats"),
      ]);
      if (toolsRes.status === "fulfilled" && toolsRes.value.ok) {
        const json = await toolsRes.value.json();
        const d = json.data;
        setTools(Array.isArray(d?.tools) ? d.tools : Array.isArray(json.tools) ? json.tools : Array.isArray(d) ? d : Array.isArray(json) ? json : []);
      }
      if (logsRes.status === "fulfilled" && logsRes.value.ok) {
        const json = await logsRes.value.json();
        const d = json.data;
        setLogs(Array.isArray(d?.logs) ? d.logs : Array.isArray(json.logs) ? json.logs : Array.isArray(d) ? d : Array.isArray(json) ? json : []);
      }
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const json = await statsRes.value.json();
        setStats(json.data || json);
      }
    } catch {
      toast.error("Forensic tool scan failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const res = await fetch('/api/stock/clients');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Client sync failed');
      }
      const json = await res.json();
      const payload = (json?.data?.data ?? json?.data ?? json) as any;
      const list = payload?.data?.clients || payload?.clients || [];
      setClients(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Client communication error';
      toast.error(msg);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categories = [
    "all",
    ...Array.from(new Set(tools.map((t) => t.category || "general"))),
  ];

  const filteredTools =
    activeCategory === "all"
      ? tools
      : tools.filter((t) => (t.category || "general") === activeCategory);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white/90 tracking-tight flex items-center gap-3">
             <Wrench className="size-6 text-emerald-400 group-hover:glow-emerald transition-all" />
            Forensic Logic Tooling
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">
             মডেলের কার্যক্ষমতা বৃদ্ধির জন্য যুক্ত করা বিশেষ টুলস এবং তাদের কার্যক্রম
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          className="h-10 px-4 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold transition-all shadow-lg"
        >
          <RefreshCw className="size-3.5 mr-2" />
          Scan Synapse
        </Button>
      </div>

      {/* Stats Row Overhaul */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          {
            label: "Logic Units",
            value: stats?.totalTools ?? tools.length,
            icon: Wrench,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Active Links",
            value: stats?.enabledTools ?? tools.filter((t) => t.enabled).length,
            icon: Zap,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: "Total Impacts",
            value: stats?.totalExecutions ?? logs.length,
            icon: BarChart3,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: "Success Depth",
            value: stats?.successRate
              ? `${Math.round(stats.successRate)}%`
              : logs.length > 0
              ? `${Math.round(
                  (logs.filter((l) => l.status === "success").length /
                    logs.length) *
                    100
                )}%`
              : "N/A",
            icon: CheckCircle2,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
        ].map((item) => (
          <div key={item.label} className={cn("glass-card rounded-2xl p-5 border transition-all hover:scale-[1.02] shadow-xl", item.bg)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                    {item.label}
                  </p>
                  <div className="text-2xl font-black text-white mt-1">
                    {loading ? (
                      <Skeleton className="h-8 w-12 bg-white/5" />
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
                <div
                  className={cn("flex items-center justify-center size-10 rounded-xl border border-white/5 shadow-inner", item.bg)}
                >
                  <item.icon className={cn("size-5", item.color)} />
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* Tabs Overhaul */}
      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-12">
          <TabsTrigger value="tools" className="rounded-xl px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-xs transition-all">
            <Wrench className="size-3.5 mr-2" />
            Registry
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-xs transition-all" onClick={fetchClients}>
            <Zap className="size-3.5 mr-2" />
            Live Synapse
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-6 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-black text-xs transition-all">
            <Terminal className="size-3.5 mr-2" />
            Footprints
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-xl px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-black text-xs transition-all">
            <BarChart3 className="size-3.5 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab Overhaul */}
        <TabsContent value="tools" className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-[10px] h-8 px-4 rounded-xl font-black uppercase tracking-widest transition-all",
                  activeCategory === cat ? "bg-emerald-600 hover:bg-emerald-500 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "all" ? "Core Matrix" : cat}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-panel h-32 rounded-2xl p-5 animate-pulse">
                   <div className="flex gap-4">
                      <div className="size-10 rounded-xl bg-white/5" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                        <div className="h-3 w-full bg-white/5 rounded" />
                      </div>
                   </div>
                </div>
              ))
            ) : filteredTools.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 glass-panel rounded-2xl py-24 flex flex-col items-center justify-center text-muted-foreground shadow-2xl">
                  <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Wrench className="size-8 opacity-20" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-white/40">Tool Matrix Empty</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool, i) => {
                  const cat = tool.category || "general";
                  const Icon = categoryIcons[cat] || Wrench;
                  const colorClass = categoryColors[cat] || categoryColors.general;

                  return (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <div className="group relative overflow-hidden h-full glass-card border border-white/5 hover:border-emerald-500/30 transition-all rounded-2xl p-5 flex flex-col shadow-xl hover:shadow-emerald-900/10">
                          {/* Glow effect */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all" />

                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn("flex items-center justify-center size-12 rounded-2xl border border-white/10 group-hover:scale-105 transition-all shadow-inner", colorClass)}
                              >
                                <Icon className="size-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight font-mono">
                                  {tool.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-black tracking-widest uppercase border-white/5 bg-black/20 mt-1.5 h-4"
                                >
                                  {cat}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <Badge
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-lg",
                                  tool.enabled
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                                    : "bg-white/5 text-white/20 border-white/5"
                                )}
                              >
                                {tool.enabled ? "ACTIVE" : "OFF"}
                              </Badge>
                              {tool.requiredAuth && (
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-black text-amber-500 border-amber-500/30 bg-amber-500/5 px-1.5 h-4"
                                >
                                  AUTH
                                </Badge>
                              )}
                            </div>
                          </div>
                          {tool.description && (
                            <p className="text-[11px] text-muted-foreground/60 mt-4 line-clamp-2 leading-relaxed italic group-hover:text-muted-foreground transition-colors overflow-hidden relative z-10">
                              &quot;{tool.description}&quot;
                            </p>
                          )}
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 relative z-20">
                             <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                                Forensic View
                             </Button>
                          </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </TabsContent>

        {/* Clients Tab Overhaul */}
        <TabsContent value="clients">
          <div className="glass-panel border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Active Matrix Links</h3>
                <p className="text-xs text-muted-foreground mt-1">
                   স্টক সার্ভারের সাথে সরাসরি যুক্ত এডিটর সেশনসমূহ
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-bold text-xs" onClick={fetchClients}>
                <RefreshCw className={cn("size-3.5 mr-2", clientsLoading && "animate-spin")} />
                Sync Grid
              </Button>
            </div>
            <div className="p-8">
              {clientsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                  <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                </div>
              ) : clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic border-white/5 border-2 border-dashed rounded-3xl">
                  <Zap className="size-10 mb-4 opacity-10" />
                  <p className="text-sm font-black text-white/20 uppercase tracking-[0.2em]">Zero Live Synchronizations</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clients.map((c, i) => (
                    <motion.div 
                      key={c.clientId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-3xl bg-black/40 border border-white/10 hover:border-blue-500/30 transition-all flex items-center justify-between group shadow-lg"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                           <Terminal className="size-6 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">
                            {c.clientId}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate mt-1">
                            SESSION_ID: {c.sessionId.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 font-mono">
                         <Badge className="bg-blue-500/20 text-blue-400 border-transparent text-[8px] font-black h-5">LIVE</Badge>
                         <div className="text-[9px] text-muted-foreground/40 mt-1">L: {Math.round(c.connectedForMs / 1000)}s | P: {Math.round(c.lastPingMsAgo / 1000)}s</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Logs Tab Overhaul */}
        <TabsContent value="logs">
          <div className="glass-panel border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                     <Terminal className="size-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Logic Trail</h3>
                    <p className="text-[10px] text-muted-foreground font-bold italic">সিস্টেমের প্রতিটি টুলের ব্যবহারের বিস্তারিত ইতিহাস</p>
                  </div>
               </div>
               <Badge className="bg-amber-600 text-white font-black text-[10px] px-3">{logs.length} Entries Ready</Badge>
            </div>

            <ScrollArea className="flex-1 p-6 forensic-scroll bg-[#050608]">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                  <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-muted-foreground italic">
                  <Terminal className="size-12 mb-4 opacity-5" />
                  <p className="text-sm font-black text-white/10 uppercase tracking-[0.3em]">Zero Forensic Imprints</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {logs.map((log, idx) => (
                      <motion.div
                        key={log.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/20 transition-all group relative overflow-hidden flex items-center justify-between shadow-lg"
                      >
                         {/* Subtle status backdrop */}
                         <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 transition-all",
                            log.status === "success" ? "bg-emerald-500/40" : log.status === "error" ? "bg-red-500/40" : "bg-amber-500/40"
                         )} />

                         <div className="flex flex-col gap-1 z-10">
                            <div className="flex items-center gap-3">
                               <span className="text-xs font-black text-white tracking-widest uppercase font-mono group-hover:text-amber-400 transition-colors">
                                 {log.toolName || "UNDEFINED_TOOL"}
                               </span>
                               <Badge
                                 className={cn(
                                   "text-[8px] font-black tracking-widest px-1.5 h-4",
                                   log.status === "success" ? "bg-emerald-500/20 text-emerald-400 border-transparent shadow-emerald-900/10" : "bg-red-500/20 text-red-400 border-transparent"
                                 )}
                               >
                                 {log.status?.toUpperCase()}
                               </Badge>
                            </div>
                            {log.error && (
                              <p className="text-[10px] text-red-500/70 font-mono mt-1 w-full max-w-[400px] truncate bg-red-950/20 p-1.5 rounded-lg border border-red-900/10">
                                EXCEPTION: {log.error}
                              </p>
                            )}
                         </div>

                         <div className="flex items-center gap-6 z-10">
                            <div className="text-right font-mono">
                               <div className="text-[10px] text-white/20 font-black uppercase">METRICS</div>
                               <div className="text-[11px] text-amber-400/60 font-black group-hover:text-amber-400 transition-colors">
                                  {log.duration != null ? `${log.duration}ms` : "???"}
                               </div>
                            </div>
                            <div className="text-right font-mono border-l border-white/5 pl-6 min-w-[100px]">
                               <div className="text-[10px] text-white/20 font-black uppercase">TIMESTAMP</div>
                               <div className="text-[11px] text-muted-foreground font-black">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "--:--:--"}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Analytics Tab Overhaul */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Execution Overview Overhaul */}
            <div className="glass-panel border-white/5 rounded-3xl p-8 shadow-2xl space-y-8 h-full">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                     <BarChart3 className="size-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Logic Efficiency</h3>
                    <p className="text-[10px] text-muted-foreground font-bold italic">সফলতা এবং কার্যক্ষমতার গ্রাফিক্যাল চিত্র</p>
                  </div>
                </div>

                {loading ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="h-10 w-full bg-white/5 rounded-xl" />
                      <div className="h-10 w-full bg-white/5 rounded-xl" />
                    </div>
                ) : (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Matrix Stability</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {stats?.successRate ? `${Math.round(stats.successRate)}%` : "99.9%"}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${stats?.successRate ?? 100}%` }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-inner group hover:border-white/20 transition-all">
                           <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Mean Response</div>
                           <div className="text-2xl font-black text-white font-mono group-hover:text-purple-400 transition-colors">
                              {stats?.avgLatency ? `${Math.round(stats.avgLatency)}ms` : "42ms"}
                           </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-inner group hover:border-white/20 transition-all">
                           <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Neural Shifts</div>
                           <div className="text-2xl font-black text-white font-mono group-hover:text-amber-400 transition-colors">
                              {stats?.totalExecutions ?? logs.length}
                           </div>
                        </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Category Breakdown Overhaul */}
            <div className="glass-panel border-white/5 rounded-3xl p-8 shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-inner">
                     <Cpu className="size-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Neural Distribution</h3>
                    <p className="text-[10px] text-muted-foreground font-bold italic">বিভিন্ন ক্যাটাগরিতে সিস্টেমের সক্ষমতার বণ্টন</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 forensic-scroll pr-4 bg-black/20 rounded-3xl p-4">
                  {loading ? (
                    <div className="space-y-3">
                       <Skeleton className="h-12 w-full bg-white/5 rounded-2xl" />
                       <Skeleton className="h-12 w-full bg-white/5 rounded-2xl" />
                    </div>
                  ) : stats?.categoryBreakdown ? (
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(stats.categoryBreakdown).map(([cat, count], i) => {
                        const Icon = categoryIcons[cat] || Wrench;
                        const colorClass = categoryColors[cat] || categoryColors.general;
                        return (
                          <motion.div
                            key={cat}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0b0d] border border-white/5 group hover:border-white/20 transition-all shadow-md"
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn("size-10 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-105 transition-all", colorClass)}>
                                <Icon className="size-5" />
                              </div>
                              <span className="text-xs font-black text-white/70 uppercase tracking-widest">{cat}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <Badge className="bg-white/5 text-white/40 border-transparent font-black px-3 h-6">
                                  {count} Units
                               </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-10">
                       <Cpu className="size-12 mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No Sector Data</p>
                    </div>
                  )}
                </ScrollArea>
            </div>

            {/* Top Tools Overhaul */}
            <div className="md:col-span-2 glass-panel border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                     <Zap className="size-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">High Impact Entities</h3>
                    <p className="text-[10px] text-muted-foreground font-bold italic">বর্তমানে সবচেয়ে সক্রিয় এবং কার্যকরী টুলসসমূহ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-16 bg-white/5 rounded-2xl" />
                      <Skeleton className="h-16 bg-white/5 rounded-2xl" />
                    </>
                  ) : stats?.topTools && stats.topTools.length > 0 ? (
                    stats.topTools.map((tool, idx) => (
                      <div key={tool.name} className="flex items-center justify-between p-5 rounded-3xl bg-black/40 border border-white/10 group hover:border-amber-500/30 transition-all shadow-lg overflow-hidden relative">
                         <div className="absolute inset-0 bg-amber-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="flex items-center gap-5 relative z-10">
                            <span className="text-lg font-black text-white/10 italic font-mono w-6">{idx + 1}</span>
                            <div>
                               <div className="text-sm font-black text-white tracking-tight group-hover:text-amber-400 transition-colors uppercase font-mono">{tool.name}</div>
                               <div className="text-[10px] text-muted-foreground/40 mt-1 font-bold">TOTAL CALENDAR_IMPACTS</div>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-1 relative z-10">
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 h-6 font-black text-[10px]">
                               {tool.count} CALLS
                            </Badge>
                            {tool.successRate != null && (
                               <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter shadow-emerald-900/10">S_STABILITY: {Math.round(tool.successRate)}%</div>
                            )}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-20 opacity-10">
                       <Zap className="size-10 mx-auto mb-4" />
                       <p className="text-xs font-black">Zero Activity Footprint</p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
