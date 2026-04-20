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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBadge } from "./health-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Bot,
  RefreshCw,
  Cpu,
  MessageSquare,
  Sparkles,
  Shield,
  Wrench,
  Pencil,
  Eye,
  Clock,
  Brain,
  Server,
  Hash,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type?: string;
  persona?: string;
  personaName?: string;
  status?: string;
  capabilities?: string[];
  providerId?: string;
  systemPrompt?: string;
  description?: string;
  provider?: { id: string; name: string; type: string } | null;
  _count?: { memories: number; chatSessions: number; toolAssignments: number };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const typeColors: Record<string, string> = {
  chatbot: "text-emerald-400 bg-emerald-500/15",
  assistant: "text-cyan-400 bg-cyan-500/15",
  coder: "text-amber-400 bg-amber-500/15",
  researcher: "text-purple-400 bg-purple-500/15",
  custom: "text-pink-400 bg-pink-500/15",
};

const typeLabels: Record<string, string> = {
  chatbot: "Chatbot",
  assistant: "Assistant",
  coder: "Coder",
  researcher: "Researcher",
  custom: "Custom",
};

export function AgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "assistant",
    persona: "",
    systemPrompt: "",
    providerId: "",
    model: "",
  });

  const [providers, setProviders] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const json = await res.json();
        setAgents(json.data || json || []);
      }
    } catch {
      toast.error("Forensic scan for agents failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        setProviders(list);
      }
    } catch {
      // Silently fail forensic fallback
    }
  }, []);

  const fetchModelsForProvider = useCallback(async (providerId: string) => {
    if (!providerId) {
      setAvailableModels([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/models?providerId=${encodeURIComponent(providerId)}`,
      );
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const models = (data?.runtime?.models || []) as string[];
        setAvailableModels(models);
      } else {
        setAvailableModels([]);
      }
    } catch {
      setAvailableModels([]);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchProviders();
  }, [fetchAgents, fetchProviders]);

  useEffect(() => {
    void fetchModelsForProvider(formData.providerId);
  }, [formData.providerId, fetchModelsForProvider]);

  const resetForm = () =>
    setFormData({
      name: "",
      type: "assistant",
      persona: "",
      systemPrompt: "",
      providerId: "",
      model: "",
    });

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Agent designation is mandatory");
      return;
    }
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          personaName: formData.persona,
          systemPrompt: formData.systemPrompt,
          providerId: formData.providerId || undefined,
          config: {
            model: formData.model || undefined,
          },
        }),
      });
      if (res.ok) {
        toast.success(`Agent "${formData.name}" initialized in core`);
        setCreateOpen(false);
        resetForm();
        fetchAgents();
      } else {
        const err = await res.json();
        toast.error(err.error || "Initialization failed");
      }
    } catch {
      toast.error("Communication failure during agent birth");
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditAgent(agent);
    const existingConfig = (agent as Record<string, unknown>).config;
    const parsedConfig =
      typeof existingConfig === "string"
        ? (JSON.parse(existingConfig || "{}") as { model?: string })
        : (existingConfig as { model?: string } | undefined);
    setFormData({
      name: agent.name,
      type: agent.type || "assistant",
      persona: agent.personaName || agent.persona || "",
      systemPrompt: agent.systemPrompt || "",
      providerId: agent.providerId || "",
      model: parsedConfig?.model || "",
    });
    setEditOpen(true);
  };

  const handleViewDetail = (agent: Agent) => {
    setDetailAgent(agent);
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!editAgent) return;
    try {
      const res = await fetch(`/api/agents/${editAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          personaName: formData.persona,
          systemPrompt: formData.systemPrompt,
          providerId: formData.providerId || null,
          config: {
            model: formData.model || undefined,
          },
        }),
      });
      if (res.ok) {
        toast.success(`Agent "${formData.name}" recalibrated`);
        setEditOpen(false);
        setEditAgent(null);
        fetchAgents();
      } else {
        const err = await res.json();
        toast.error(err.error || "Recalibration failed");
      }
    } catch {
      toast.error("Recalibration communication error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Agent terminated from system");
        fetchAgents();
      } else {
        const err = await res.json();
        toast.error(err.error || "Termination sequence failed");
      }
    } catch {
      toast.error("Termination network failure");
    }
  };

  const parseStatus = (
    s?: string,
  ): "healthy" | "unhealthy" | "degraded" | "unknown" => {
    if (!s) return "unknown";
    const lower = s.toLowerCase();
    if (lower === "active" || lower === "online") return "healthy";
    if (lower === "inactive" || lower === "offline") return "unhealthy";
    if (lower === "error") return "unhealthy";
    return "unknown";
  };

  const agentForm = (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
          Forensic Designation
        </Label>
        <Input
          placeholder="e.g., Clinical Investigator v2"
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 h-11"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
            Infrastructure Bridge
          </Label>
          <Select
            value={formData.providerId}
            onValueChange={(v) => setFormData({ ...formData, providerId: v })}
          >
            <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
              {providers.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="focus:bg-emerald-500/20"
                >
                  {p.name}
                </SelectItem>
              ))}
              {providers.length === 0 && (
                <SelectItem value="none" disabled>
                  Zero Providers Active
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
            Intelligence Override
          </Label>
          <Select
            value={formData.model}
            onValueChange={(v) => setFormData({ ...formData, model: v })}
            disabled={!formData.providerId}
          >
            <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11">
              <SelectValue
                placeholder={
                  formData.providerId ? "Target model" : "Sync provider first"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
              {availableModels.map((m) => (
                <SelectItem
                  key={m}
                  value={m}
                  className="focus:bg-emerald-500/20"
                >
                  {m}
                </SelectItem>
              ))}
              {availableModels.length === 0 && (
                <SelectItem value="none" disabled>
                  No Brain Files found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
          Archetype Architecture
        </Label>
        <Select
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v })}
        >
          <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
            <SelectItem value="chatbot">Chatbot Interface</SelectItem>
            <SelectItem value="assistant">General Assistant</SelectItem>
            <SelectItem value="coder">Logic Investigator (Coder)</SelectItem>
            <SelectItem value="researcher">Deep Forensic Scanner</SelectItem>
            <SelectItem value="custom">Singularity (Custom)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
          Persona Blueprint
        </Label>
        <Input
          placeholder="e.g., High-precision code auditor"
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 h-11"
          value={formData.persona}
          onChange={(e) =>
            setFormData({ ...formData, persona: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em]">
          Forensic Logic (System Prompt)
        </Label>
        <Textarea
          placeholder="Injection sequence for agent intelligence..."
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 min-h-[120px] font-mono text-xs"
          value={formData.systemPrompt}
          onChange={(e) =>
            setFormData({ ...formData, systemPrompt: e.target.value })
          }
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white/90 tracking-tight flex items-center gap-3">
            <Bot className="size-6 text-emerald-400 group-hover:glow-emerald transition-all" />
            Active Agent Command
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            সিস্টেমের প্রতিটি বুদ্ধিমত্তা এবং তাদের কার্যক্রম এখান থেকে
            নির্ধারিত হয়
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgents}
            className="h-10 px-4 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
          >
            <RefreshCw className="size-3.5 mr-2" />
            Scan Core
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all"
              >
                <Plus className="size-3.5 mr-2" />
                Initialize Intelligence
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-tight">
                  Agent Genesis Protocol
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/60">
                  Construct a new autonomous entity within the Masood Ecosystem.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] px-1">{agentForm}</ScrollArea>
              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="ghost"
                  className="rounded-xl hover:bg-white/5"
                  onClick={() => {
                    setCreateOpen(false);
                    resetForm();
                  }}
                >
                  Abort
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6"
                >
                  Finalize Genesis
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Agent Cards Grid Overhaul */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-6 h-[320px] space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className="size-10 rounded-xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-white/5 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-white/5 rounded" />
              </div>
              <div className="h-20 w-full bg-white/5 rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-white/5 rounded-lg" />
                <div className="h-10 bg-white/5 rounded-lg" />
                <div className="h-10 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-white/5 glass-panel py-24 flex flex-col items-center justify-center text-muted-foreground shadow-2xl">
          <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Brain className="size-8 opacity-20" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/40">
            Zero Entity Presence
          </p>
          <p
            className="text-xs mt-2 italic text-muted-foreground/50 underline cursor-pointer hover:text-emerald-400 transition-colors"
            onClick={() => setCreateOpen(true)}
          >
            Execute humanity-v2 Genesis now
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="group h-full relative overflow-hidden rounded-2xl glass-panel border border-white/5 hover:border-emerald-500/30 transition-all duration-300 p-6 flex flex-col shadow-xl hover:shadow-emerald-900/10">
                  {/* Glowing background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "size-12 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-all shadow-inner",
                          typeColors[agent.type || ""] ||
                            "text-zinc-400 bg-zinc-500/15",
                        )}
                      >
                        <Bot className="size-6 transition-transform group-hover:rotate-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight leading-none">
                          {agent.name}
                        </h3>
                        <div className="text-[10px] font-mono text-muted-foreground/60 mt-1.5 flex items-center gap-1.5">
                          <Hash className="size-2.5" /> {agent.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <HealthBadge
                      status={parseStatus(agent.status as string | undefined)}
                      label={(agent.status as string)?.toUpperCase() || "IDLE"}
                      className="px-2"
                    />
                  </div>

                  <div className="mt-6 flex-1 relative z-10">
                    {(agent.personaName ||
                      agent.persona ||
                      agent.description) && (
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic line-clamp-3 p-3 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                        &quot;
                        {agent.personaName ||
                          agent.persona ||
                          agent.description}
                        &quot;
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-4">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] font-black tracking-widest uppercase border-transparent px-2 h-5",
                          typeColors[agent.type || ""] || "bg-white/5",
                        )}
                      >
                        {typeLabels[agent.type || ""] || agent.type || "custom"}
                      </Badge>
                      {agent.capabilities?.slice(0, 2).map((cap) => (
                        <Badge
                          key={cap}
                          variant="outline"
                          className="text-[8px] px-1.5 h-4 border-white/5 text-muted-foreground font-mono"
                        >
                          {cap}
                        </Badge>
                      ))}
                      {(agent.capabilities?.length || 0) > 2 && (
                        <span className="text-[8px] text-muted-foreground/40 font-bold">
                          +{agent.capabilities!.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Agent Metrics - Overhaul */}
                    <div className="grid grid-cols-3 gap-2 text-center mt-6">
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-emerald-500/[0.03] transition-colors shadow-sm">
                        <div className="text-[9px] text-muted-foreground/40 font-black uppercase mb-1">
                          Cortex
                        </div>
                        <div className="text-sm font-black text-white">
                          {agent._count?.memories ?? 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-blue-500/[0.03] transition-colors shadow-sm">
                        <div className="text-[9px] text-muted-foreground/40 font-black uppercase mb-1">
                          Link
                        </div>
                        <div className="text-sm font-black text-white">
                          {agent._count?.chatSessions ?? 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-amber-500/[0.03] transition-colors shadow-sm">
                        <div className="text-[9px] text-muted-foreground/40 font-black uppercase mb-1">
                          Synap
                        </div>
                        <div className="text-sm font-black text-white">
                          {agent._count?.toolAssignments ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {agent.provider && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground/60 font-medium relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Server className="size-3 text-emerald-500/50" />
                        <span className="truncate max-w-[100px]">
                          {agent.provider.name}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[8px] px-1 h-4 border-white/10 opacity-30"
                      >
                        {agent.provider.type}
                      </Badge>
                    </div>
                  )}

                  {/* Operational Controls - Hover Reveal */}
                  <div className="mt-4 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 relative z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-xl text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => handleViewDetail(agent)}
                      title="Forensic Dive"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-xl text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => handleEdit(agent)}
                      title="Recalibrate"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#0d0f14] border-red-500/20 text-white backdrop-blur-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-black text-red-500">
                            Termination Protocol
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/60">
                            Confirm systemic deletion of entity &quot;
                            {agent.name}&quot;. All neural links, memories, and
                            sessions will be scrubbed from the forensic history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(agent.id)}
                            className="bg-red-600 text-white hover:bg-red-500 rounded-xl px-6"
                          >
                            Execute Termination
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialog Overhaul */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-3xl max-w-2xl overflow-hidden p-0 rounded-3xl shadow-2xl">
          {detailAgent && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-8 pb-4 relative overflow-hidden">
                {/* Artistic Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32" />

                <div className="flex items-center gap-6 relative z-10">
                  <div
                    className={cn(
                      "size-20 rounded-3xl flex items-center justify-center border-2 border-white/5 shadow-2xl transition-all glow-emerald",
                      typeColors[detailAgent.type || ""] ||
                        "text-zinc-400 bg-zinc-500/15",
                    )}
                  >
                    <Bot className="size-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black tracking-tight text-white">
                        {detailAgent.name}
                      </h3>
                      <HealthBadge
                        status={parseStatus(
                          detailAgent.status as string | undefined,
                        )}
                        label={
                          (detailAgent.status as string)?.toUpperCase() ||
                          "MONITORED"
                        }
                        className="px-3 py-1 font-black text-[10px]"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-white/10 text-emerald-400/60 "
                      >
                        {detailAgent.id}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] uppercase font-black px-2 py-0.5",
                          typeColors[detailAgent.type || ""],
                        )}
                      >
                        {typeLabels[detailAgent.type || ""] || detailAgent.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 overflow-y-auto forensic-scroll flex-1 relative z-10">
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-5 rounded-3xl bg-black/60 border border-white/5 text-center group hover:border-emerald-500/30 transition-all">
                    <Brain className="size-6 text-emerald-500 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                    <div className="text-2xl font-black text-white">
                      {detailAgent._count?.memories ?? 0}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">
                      Cortex Neurons
                    </div>
                  </div>
                  <div className="p-5 rounded-3xl bg-black/60 border border-white/5 text-center group hover:border-blue-500/30 transition-all">
                    <MessageSquare className="size-6 text-blue-500 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                    <div className="text-2xl font-black text-white">
                      {detailAgent._count?.chatSessions ?? 0}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">
                      Session Depth
                    </div>
                  </div>
                  <div className="p-5 rounded-3xl bg-black/60 border border-white/5 text-center group hover:border-amber-500/30 transition-all">
                    <Wrench className="size-6 text-amber-500 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                    <div className="text-2xl font-black text-white">
                      {detailAgent._count?.toolAssignments ?? 0}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">
                      Synaptic Tools
                    </div>
                  </div>
                </div>

                {detailAgent.provider && (
                  <div className="mt-8 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                        <Server className="size-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-white/20 tracking-widest">
                          Active Infrastructure
                        </div>
                        <div className="text-sm font-bold text-white/90">
                          {detailAgent.provider.name}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3"
                    >
                      {detailAgent.provider.type?.toUpperCase()}
                    </Badge>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  {(detailAgent.personaName || detailAgent.persona) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                        <Shield className="size-3" /> Entity Persona
                      </div>
                      <div className="p-5 rounded-3xl bg-black/60 border border-white/5 text-sm text-white/80 leading-relaxed italic border-l-emerald-500/50 border-l-4">
                        &quot;{detailAgent.personaName || detailAgent.persona}
                        &quot;
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                      <Hash className="size-3" /> System Logic Core
                    </div>
                    <div className="p-6 rounded-3xl bg-[#07080a] border border-white/10 font-mono text-xs leading-relaxed text-emerald-500/90 whitespace-pre-wrap shadow-inner relative overflow-hidden group">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="size-4 animate-pulse" />
                      </div>
                      {detailAgent.systemPrompt || "NO SYSTEM LOGIC ASSIGNED"}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  <span>
                    ESTABLISHED:{" "}
                    {detailAgent.createdAt
                      ? new Date(detailAgent.createdAt).toLocaleDateString()
                      : "???"}
                  </span>
                  <div className="flex items-center gap-4">
                    <Clock className="size-3" />
                    {detailAgent.updatedAt
                      ? new Date(detailAgent.updatedAt).toLocaleTimeString()
                      : "READY"}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl flex justify-end">
                <Button
                  onClick={() => setDetailOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 font-black text-xs uppercase tracking-widest"
                >
                  Exit Forensic View
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recalibration Dialog Overhaul */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Pencil className="size-6 text-emerald-400 glow-emerald" /> Entity
              Recalibration
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/60">
              Update neural parameters for agent &quot;{editAgent?.name}&quot;.
              Synapse shifts are instantaneous.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">{agentForm}</ScrollArea>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="ghost"
              className="rounded-xl hover:bg-white/5"
              onClick={() => {
                setEditOpen(false);
                setEditAgent(null);
              }}
            >
              Abort
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 font-black uppercase tracking-widest text-xs"
            >
              Commit Synapse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Label component to avoid extra import
function Label({
  children,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${props.className || ""}`}
      {...props}
    >
      {children}
    </label>
  );
}
