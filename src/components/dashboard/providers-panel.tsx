"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Play,
  Zap,
  Globe,
  Loader2,
  RefreshCw,
  Server,
  Pencil,
  Eye,
  Clock,
  Activity,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type?: string;
  endpoint?: string;
  model?: string;
  status?: string;
  isDefault?: boolean;
  latency?: number;
  lastHealthCheck?: string;
  errorCount?: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
  config?: string;
  [key: string]: unknown;
}

export function ProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "openai",
    endpoint: "",
    model: "",
    apiKeyEnvVar: "",
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const json = await res.json();
        setProviders(json.data || json || []);
      }
    } catch {
      toast.error("Failed to fetch forensic providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const resetForm = () =>
    setFormData({ name: "", type: "openai", endpoint: "", model: "", apiKeyEnvVar: "" });

  const handleCreate = async () => {
    if (!formData.name || !formData.endpoint) {
      toast.error("Identity and endpoint are mandatory");
      return;
    }
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(`Provider "${formData.name}" established in chain`);
        setCreateOpen(false);
        resetForm();
        fetchProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Establishment failed");
      }
    } catch {
      toast.error("Communication failure during creation");
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type || "openai",
      endpoint: provider.endpoint || "",
      model: provider.model || "",
      apiKeyEnvVar: (provider as Record<string, unknown>).apiKeyEnvVar as string || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editProvider) return;
    try {
      const res = await fetch(`/api/providers/${editProvider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(`Provider "${formData.name}" re-synchronized`);
        setEditOpen(false);
        setEditProvider(null);
        fetchProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Synchronization failed");
      }
    } catch {
      toast.error("Update communication error");
    }
  };

  const handleViewDetail = async (provider: Provider) => {
    try {
      const res = await fetch(`/api/providers/${provider.id}`);
      if (res.ok) {
        const json = await res.json();
        setDetailProvider(json.data || json);
        setDetailOpen(true);
      }
    } catch {
      toast.error("Failed to extract clinical details");
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/providers/${id}/test`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Ping successful: ${data.data?.status || "CONNECTED"} (Latency: ${data.data?.latency || "???"}ms)`
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Forensic ping failed");
      }
    } catch {
      toast.error("Network bridge error during ping");
    } finally {
      setTestingId(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/providers/${id}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Primary gateway priority shifted");
        fetchProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Priority shift failed");
      }
    } catch {
      toast.error("Database priority update error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Provider purged from ecosystem");
        fetchProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Purge failed");
      }
    } catch {
      toast.error("Purge communication failure");
    }
  };

  const parseStatus = (
    s?: string
  ): "healthy" | "unhealthy" | "degraded" | "unknown" => {
    if (!s) return "unknown";
    const lower = s.toLowerCase();
    if (lower === "active" || lower === "healthy" || lower === "connected")
      return "healthy";
    if (lower === "inactive" || lower === "disconnected") return "unhealthy";
    if (lower === "error" || lower === "unhealthy") return "unhealthy";
    return "unknown";
  };

  const providerForm = (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="provider-name" className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Gateway Alias</Label>
        <Input
          id="provider-name"
          placeholder="e.g., Clinical Gemini-1.5"
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 transition-all h-11"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider-type" className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Protocol Type</Label>
          <Select
            value={formData.type}
            onValueChange={(v) =>
              setFormData({ ...formData, type: v })
            }
          >
            <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
              <SelectItem value="ollama">Ollama (Local)</SelectItem>
              <SelectItem value="openai">OpenAI (Secure)</SelectItem>
              <SelectItem value="gemini">Google Vertex (Masood Edition)</SelectItem>
              <SelectItem value="llamacpp">LlamaCpp (Low Latency)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider-model" className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Target Model</Label>
          <Input
            id="provider-model"
            placeholder="e.g., gemma:7b-instruct"
            className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 transition-all h-11"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider-endpoint" className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Secure Endpoint URL</Label>
        <Input
          id="provider-endpoint"
          placeholder="http://localhost:11434"
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 transition-all h-11 font-mono text-xs"
          value={formData.endpoint}
          onChange={(e) =>
            setFormData({ ...formData, endpoint: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider-apikey" className="text-white/60 text-[10px] uppercase font-bold tracking-widest">API Key Reference (ENV)</Label>
        <Input
          id="provider-apikey"
          placeholder="e.g., GEMINI_API_KEY"
          className="bg-black/40 border-white/10 rounded-xl focus:border-emerald-500/50 transition-all h-11 font-mono text-xs"
          value={formData.apiKeyEnvVar}
          onChange={(e) =>
            setFormData({ ...formData, apiKeyEnvVar: e.target.value })
          }
        />
        <p className="text-[10px] text-muted-foreground/60 italic">
          Encryption Notice: We only store the *name* of your ENV variable. Zero-Exfiltration protocol active.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white/90 tracking-tight flex items-center gap-3">
             <Server className="size-6 text-emerald-400" />
            Gateway Infrastructure
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
             প্রোতটি টানেল এবং প্রোভাইডার এখানে নিরাপদ ও ফোরেনসিকালি ট্র্যাক করা হয়
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProviders}
            className="h-10 px-4 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
          >
            <RefreshCw className="size-3.5 mr-2" />
            Sync Chain
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all">
                <Plus className="size-3.5 mr-2" />
                Establish New Link
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-tight">Gatekeeper Protocol: New Link</DialogTitle>
                <DialogDescription className="text-muted-foreground/60">
                   Configure a secure AI gateway. Requests are isolated via the Masood Bridge.
                </DialogDescription>
              </DialogHeader>
              {providerForm}
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  className="rounded-xl hover:bg-white/5"
                  onClick={() => setCreateOpen(false)}
                >
                  Abort
                </Button>
                <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6">
                  Finalize Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Providers Grid / Table Overhaul */}
      <div className="rounded-2xl border border-white/5 glass-panel overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Server className="size-8 opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/40">Zero Infrastructure Links</p>
              <p className="text-xs mt-2 italic text-muted-foreground/50 underline cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => setCreateOpen(true)}>
                Establish your first secure AI bridge now
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] py-4">Link Identity</TableHead>
                    <TableHead className="hidden sm:table-cell text-white/40 font-black uppercase tracking-widest text-[10px] py-4">Protocol</TableHead>
                    <TableHead className="hidden md:table-cell text-white/40 font-black uppercase tracking-widest text-[10px] py-4">Secure End</TableHead>
                    <TableHead className="text-white/40 font-black uppercase tracking-widest text-[10px] py-4">Integrity</TableHead>
                    <TableHead className="hidden lg:table-cell text-white/40 font-black uppercase tracking-widest text-[10px] py-4 text-center">Latency</TableHead>
                    <TableHead className="text-right text-white/40 font-black uppercase tracking-widest text-[10px] py-4">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {providers.map((provider, i) => (
                      <motion.tr
                        key={provider.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="group border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                      >
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 group-hover:glow-emerald transition-all">
                              <Globe className="size-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {provider.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {provider.isDefault && (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0 h-4 font-black">
                                    PRIMARY
                                  </Badge>
                                )}
                                <span className="text-[10px] font-mono text-muted-foreground/60">{provider.model || "AUTO"}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] font-bold border-white/10 bg-black/40 text-blue-400">
                            {provider.type?.toUpperCase() || "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-[11px] font-mono text-muted-foreground/60 max-w-[180px] truncate italic group-hover:text-white/60 transition-colors tracking-tighter">
                          {provider.endpoint || "—"}
                        </TableCell>
                        <TableCell>
                          <HealthBadge
                            status={parseStatus(provider.status as string | undefined)}
                            label={
                              (provider.status as string | undefined)?.toUpperCase() || "PENDING"
                            }
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] font-mono text-emerald-400">
                             {provider.latency ? (
                               <>
                                 <Clock className="size-3" />
                                 {provider.latency}ms
                               </>
                             ) : "SYNCING"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 px-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-lg text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
                              onClick={() => handleViewDetail(provider)}
                              title="Forensic Details"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
                              onClick={() => handleEdit(provider)}
                              title="Update Config"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                              onClick={() => handleTest(provider.id)}
                              disabled={testingId === provider.id}
                              title="Forensic Ping"
                            >
                              {testingId === provider.id ? (
                                <Loader2 className="size-4 animate-spin text-blue-500" />
                              ) : (
                                <Play className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/5 transition-all"
                              onClick={() => handleActivate(provider.id)}
                              title="Set as Default Gateway"
                            >
                              <Zap className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#0d0f14] border-red-500/20 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-red-500 flex items-center gap-2 font-black">
                                    <Trash2 className="size-5" /> Purge Protocol
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/60">
                                    Are you certain you want to purge &quot;
                                    {provider.name}&quot; from the gateway architecture? All active sessions using this bridge will be terminated.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(provider.id)}
                                    className="bg-red-600 text-white hover:bg-red-500 rounded-xl px-6"
                                  >
                                    Execute Purge
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
      </div>

      {/* Edit Dialog Overhaul */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
               <Pencil className="size-5 text-emerald-400" /> Re-sync Gateway Config
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/60">
               Update the digital parameters for this provider. Changes are real-time.
            </DialogDescription>
          </DialogHeader>
          {providerForm}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="rounded-xl hover:bg-white/5"
              onClick={() => {
                setEditOpen(false);
                setEditProvider(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6">
              Establish Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog Overhaul */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#0d0f14] border-white/10 text-white backdrop-blur-3xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black">
              <Globe className="size-8 text-emerald-400 glow-emerald" />
              {detailProvider?.name || "System Forensic Report"}
            </DialogTitle>
            <DialogDescription className="text-emerald-500/60 font-mono text-[10px] uppercase tracking-widest mt-1">Deep Link Configuration & Latency Metrics</DialogDescription>
          </DialogHeader>
          {detailProvider && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 relative overflow-hidden">
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-40">Internal ID</div>
                  <div className="text-xs font-mono text-emerald-400 overflow-hidden text-ellipsis">{detailProvider.id}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/5">
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-40">Architecture</div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-black">{detailProvider.type?.toUpperCase()}</Badge>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/5">
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-40">Integrity Check</div>
                  <HealthBadge
                    status={parseStatus(detailProvider.status as string | undefined)}
                    label={(detailProvider.status as string)?.toUpperCase() || "OFFLINE"}
                    className="h-6"
                  />
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/5">
                  <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-40">System Role</div>
                  <Badge variant={detailProvider.isDefault ? "default" : "outline"} className={cn(detailProvider.isDefault ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 border-white/10 opacity-30")}>
                    {detailProvider.isDefault ? "PRIMARY GATEWAY" : "RESERVE"}
                  </Badge>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/[0.03] to-transparent border border-white/5 relative">
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-4">
                  <Activity className="size-3" /> Forensic Performance Metrics
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground/60 font-bold">AVG LATENCY</span>
                    <div className="text-2xl font-black text-white">{detailProvider.latency ? `${detailProvider.latency}ms` : "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground/60 font-bold">FAILURE COUNT</span>
                    <div className={cn("text-2xl font-black", (detailProvider.errorCount ?? 0) > 0 ? "text-red-500" : "text-emerald-400")}>{detailProvider.errorCount ?? 0}</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] text-muted-foreground/60 font-bold">LAST SCAN TIMESTAMP</span>
                    <div className="text-xs font-mono text-white/40 italic">
                      {detailProvider.lastHealthCheck
                        ? new Date(detailProvider.lastHealthCheck).toLocaleString()
                        : "NO SCAN DATA AVAILABLE"}
                    </div>
                  </div>
                </div>
                {detailProvider.lastError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-[10px] text-red-400 font-black tracking-widest uppercase">Last Critical Exception</span>
                    <div className="text-xs text-red-500/80 font-mono mt-1 break-words">{detailProvider.lastError}</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Connection Logic</div>
                <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                      <span className="text-[8px] text-muted-foreground/60 font-black">SECURE ENDPOINT</span>
                      <div className="text-xs font-mono text-white/90 break-all mt-1">{detailProvider.endpoint || "NULL"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                      <span className="text-[8px] text-muted-foreground/60 font-black">AI MODEL DESIGNATION</span>
                      <div className="text-xs font-mono text-emerald-400 mt-1">{detailProvider.model || "INHERIT FROM TYPE"}</div>
                    </div>
                    {(detailProvider as Record<string, unknown>).apiKeyEnvVar && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/20 transition-colors">
                        <span className="text-[8px] text-emerald-400/60 font-black">SYSTEM ENV REFERENCE</span>
                        <div className="text-xs font-mono text-emerald-400 mt-1">{(detailProvider as Record<string, unknown>).apiKeyEnvVar as string}</div>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[9px] font-mono text-muted-foreground/40 italic">
                <span>ESTABLISHED: {detailProvider.createdAt ? new Date(detailProvider.createdAt).toLocaleDateString() : "???"}</span>
                <span>LAST SYNC: {detailProvider.updatedAt ? new Date(detailProvider.updatedAt).toLocaleTimeString() : "???"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Label component
function Label({ children, ...props }: { children: React.ReactNode; className?: string } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${props.className || ""}`}
      {...props}
    >
      {children}
    </label>
  );
}
