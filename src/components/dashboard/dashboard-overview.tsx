"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, Variants } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBadge } from "./health-badge";
import {
  Server,
  Bot,
  MessageSquare,
  Brain,
  Activity,
  Clock,
  MapPin,
  User,
  Building2,
  Skull,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Database,
  Wifi,
} from "lucide-react";

interface HealthData {
  status?: string;
  services?: {
    database?: string;
    stockServer?: string;
    providers?: Record<string, string>;
  };
  uptime?: number;
  version?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface MetricsData {
  providers?: { total: number } | number;
  agents?: { total: number } | number;
  sessions?: { total: number } | number;
  memories?: { agent?: number; individual?: number; total: number } | number;
  tools?: { totalExecutions: number; successRate: string };
  [key: string]: unknown;
}

interface StatusData {
  identity?: {
    name?: string;
    version?: string;
    tagline?: string;
    owner?: string;
    organization?: string;
  };
  uptime?: number;
  activeProvider?: { name?: string; type?: string; model?: string };
  counts?: {
    providers?: number;
    agents?: number;
    sessions?: number;
    memories?: number;
  };
  [key: string]: unknown;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DashboardOverview() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // We don't set loading to true on every interval to prevent flickers
    try {
      const [healthRes, metricsRes, statusRes] = await Promise.allSettled([
        fetch("/api/health"),
        fetch("/api/metrics"),
        fetch("/api/status"),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const data = await healthRes.value.json();
        setHealth(data.data || data);
      }
      if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
        const data = await metricsRes.value.json();
        setMetrics(data.data || data);
      }
      if (statusRes.status === "fulfilled" && statusRes.value.ok) {
        const data = await statusRes.value.json();
        setStatus(data.data || data);
      }
    } catch {
      // Silently fail, show loading skeleton as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s for more "Real-time" feel
    return () => clearInterval(interval);
  }, [fetchData]);

  const parseStatus = (
    s?: string,
  ): "healthy" | "unhealthy" | "degraded" | "unknown" => {
    if (!s) return "unknown";
    const lower = s.toLowerCase();
    if (
      lower === "healthy" ||
      lower === "ok" ||
      lower === "up" ||
      lower === "connected" ||
      lower === "active"
    )
      return "healthy";
    if (lower === "degraded" || lower === "warning") return "degraded";
    if (
      lower === "unhealthy" ||
      lower === "down" ||
      lower === "error" ||
      lower === "disconnected" ||
      lower === "inactive"
    )
      return "unhealthy";
    return "unknown";
  };

  const formatUptime = (seconds?: number): string => {
    if (seconds == null) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const resolveNum = (val?: { total: number } | number): number => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    return val.total ?? 0;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* System Identity - Masood Edition */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 glass-panel p-6 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Skull className="size-32 text-emerald-500 animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-emerald-400 shrink-0 border border-emerald-500/30 glow-emerald">
              <Skull className="size-10" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight text-white/90">
                  ZombieCoder <span className="text-shimmer">Engine</span>
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 backdrop-blur-sm">
                  {status?.identity?.version || "v1.0.0"}
                </Badge>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-500/60 ml-auto">
                  <div className="size-2 rounded-full bg-emerald-500 status-active-glow" />
                  LIVE ADAPTIVE ARCHITECTURE
                </div>
              </div>
              <p className="text-lg text-muted-foreground mt-1 max-w-2xl font-light italic">
                "যেখানে কোড ও কথা বলে — আপনার বিশ্বস্ত আই ফোরেনসিক পার্টনার"
              </p>

              <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap border-t border-white/5 pt-4">
                <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <User className="size-3.5" />{" "}
                  <span className="font-medium text-white/70">
                    Sahon Srabon
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <Building2 className="size-3.5" />{" "}
                  <span className="font-medium text-white/70">
                    Developer Zone
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <MapPin className="size-3.5" />{" "}
                  <span className="font-medium text-white/70">
                    Dhaka, Bangladesh
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Health Card */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="sm:col-span-2 lg:col-span-2"
        >
          <div className="h-full glass-card rounded-2xl p-6 premium-gradient-emerald">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
                <Activity className="size-4 text-emerald-400" />
                System Integrity
              </h3>
              {(health?.uptime != null || status?.uptime != null) && (
                <Badge
                  variant="outline"
                  className="border-white/10 text-[10px] bg-black/20"
                >
                  UP: {formatUptime(health?.uptime ?? status?.uptime)}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Database className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Database
                    </p>
                    <p className="text-xs font-mono text-white/60">
                      SQLite / Prisma
                    </p>
                  </div>
                </div>
                <HealthBadge
                  status={parseStatus(
                    health?.services?.database as string | undefined,
                  )}
                />
              </div>

              <div className="group flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Wifi className="size-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Stock Server
                    </p>
                    <p className="text-xs font-mono text-white/60">
                      Streaming / WebSocket
                    </p>
                  </div>
                </div>
                <HealthBadge
                  status={parseStatus(
                    health?.services?.stockServer as string | undefined,
                  )}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Metric Cards */}
        {[
          {
            label: "Providers",
            value: resolveNum(
              metrics?.providers as { total: number } | number | undefined,
            ),
            icon: Server,
            gradient: "premium-gradient-emerald",
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/10",
            glow: "glow-emerald",
          },
          {
            label: "Agents",
            value: resolveNum(
              metrics?.agents as { total: number } | number | undefined,
            ),
            icon: Bot,
            gradient: "premium-gradient-blue",
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            glow: "glow-blue",
          },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            custom={2 + idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div
              className={`h-full glass-card rounded-2xl p-6 ${item.gradient}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">
                    {item.label}
                  </p>
                  <h4 className="text-4xl font-black text-white leading-none">
                    {loading ? <Skeleton className="h-10 w-16" /> : item.value}
                  </h4>
                </div>
                <div
                  className={`p-3 rounded-xl ${item.iconBg} ${item.glow} border border-white/10`}
                >
                  <item.icon className={`size-6 ${item.iconColor}`} />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-emerald-400/80 font-mono">
                <TrendingUp className="size-3" />
                <span>+0% THIS SESSION</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Large Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: "Conversations",
              value: resolveNum(
                metrics?.sessions as { total: number } | number | undefined,
              ),
              icon: MessageSquare,
              gradient: "premium-gradient-purple",
              iconColor: "text-purple-400",
              iconBg: "bg-purple-500/10",
            },
            {
              label: "Knowledge Bits",
              value: resolveNum(
                metrics?.memories as { total: number } | number | undefined,
              ),
              icon: Brain,
              gradient: "premium-gradient-blue",
              iconColor: "text-blue-400",
              iconBg: "bg-blue-500/10",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              custom={4 + idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div
                className={`glass-card rounded-2xl p-5 ${item.gradient} border-l-4 border-l-white/10`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.iconBg}`}>
                    <item.icon className={`size-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-6 w-12" /> : item.value}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            custom={6}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="sm:col-span-2"
          >
            <div className="glass-panel rounded-2xl p-6 border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Zap className="size-48 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
                <Zap className="size-4 text-emerald-400" /> API System Endpoints
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "/api/health",
                  "/api/status",
                  "/api/metrics",
                  "/api/providers",
                  "/api/agents",
                  "/api/chat",
                ].map((e) => (
                  <div
                    key={e}
                    className="p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-emerald-500/70 hover:bg-emerald-500/5 hover:text-emerald-400 transition-all cursor-default flex items-center gap-2"
                  >
                    <div className="size-1 rounded-full bg-emerald-500/40" />
                    {e}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Timeline/Activity */}
        <motion.div
          custom={7}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="h-full glass-card rounded-2xl overflow-hidden relative">
            <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ArrowUpRight className="size-4 text-amber-500" />
                Forensic Timeline
              </h3>
              <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {[
                {
                  t: "System initialized",
                  time: "3m ago",
                  color: "bg-emerald-500",
                },
                {
                  t: "Dashboard hot-reloaded",
                  time: "1m ago",
                  color: "bg-blue-500",
                },
                {
                  t: "Masood Engine synced",
                  time: "Live",
                  color: "bg-purple-500",
                },
                {
                  t: "Monitoring Port 9000",
                  time: "Active",
                  color: "bg-amber-500",
                },
              ].map((log, i) => (
                <div
                  key={i}
                  className="relative pl-6 pb-4 last:pb-0 border-l border-white/10"
                >
                  <div
                    className={`absolute left-0 top-0 -translate-x-1/2 size-2.5 rounded-full ${log.color} ring-4 ring-black`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-white/80">
                      {log.t}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {log.time}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-white/5 text-center">
                <button className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest hover:text-white transition-colors">
                  View All Logs →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
