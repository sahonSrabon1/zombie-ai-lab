"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, Zap, Layers, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderListItem {
  id: string;
  name: string;
  type: string;
  endpoint?: string | null;
  status?: string;
  isDefault?: boolean;
  model?: string | null;
  latencyMs?: number | null;
  usage?: { sessions: number; messages: number; lastUsedAt: string | null };
}

interface ProviderModelsResponse {
  provider: ProviderListItem;
  runtime: { models: string[]; supported: boolean };
  usage: { sessions: number; messages: number; lastUsedAt: string | null };
}

export function ModelsPanel() {
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [providerDetails, setProviderDetails] = useState<ProviderModelsResponse | null>(null);
  const [providerDetailsError, setProviderDetailsError] = useState<string>("");
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  const fetchProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch("/api/models");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Matrix retrieval failure");
      }
      const json = await res.json();
      const list = (json.data || []) as ProviderListItem[];
      setProviders(list);
      if (list.length > 0 && !selectedProviderId) {
        setSelectedProviderId(list[0].id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Infrastructure severance");
    } finally {
      setLoadingProviders(false);
    }
  }, [selectedProviderId]);

  const fetchProviderModels = useCallback(async (providerId: string) => {
    if (!providerId) return;
    setLoadingModels(true);
    try {
      setProviderDetailsError("");
      const res = await fetch(`/api/models?providerId=${encodeURIComponent(providerId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Synapse probe failed");
      }
      const json = await res.json();
      const data = (json.data || null) as ProviderModelsResponse | null;
      setProviderDetails(data);
      const current = data?.provider?.model || "";
      setSelectedModel(current);
    } catch (e) {
      setProviderDetails(null);
      const msg = e instanceof Error ? e.message : "Model discovery void";
      setProviderDetailsError(msg);
      toast.error(msg);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (!selectedProviderId) return;
    void fetchProviderModels(selectedProviderId);
  }, [selectedProviderId, fetchProviderModels]);

  const handleSaveDefaultModel = async () => {
    if (!selectedProviderId || !selectedModel) return;
    setSaving(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selectedProviderId, model: selectedModel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Control sequence rejected");
      }
      toast.success("Intelligence anchor locked");
      await fetchProviders();
      await fetchProviderModels(selectedProviderId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failure");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tight flex items-center gap-3">
             <Layers className="size-8 text-emerald-400 animate-pulse" />
            Model Matrix Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-bold italic">
             প্রোভাইডার ভিত্তিক মডেল সলেকশন এবং কনফিগারেশন হাব
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProviders}
          className="h-11 px-6 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px]"
          disabled={loadingProviders}
        >
          <RefreshCw className={cn("size-4 mr-2", loadingProviders && "animate-spin")} />
          Resync Matrix
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Provider Navigation Overhaul */}
        <div className="lg:col-span-1 space-y-4">
           <div className="glass-panel border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-black/40">
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                 <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layers className="size-3.5" />
                    Infrastructure
                 </h3>
              </div>
              <div className="p-4 space-y-2">
                {loadingProviders ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl bg-white/5" />)
                ) : providers.length === 0 ? (
                  <div className="p-8 text-center opacity-20 italic text-[10px] font-black uppercase">Zero Node Data</div>
                ) : (
                  <div className="space-y-1.5 px-1 py-1">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProviderId(p.id)}
                        className={cn(
                          "w-full flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all relative overflow-hidden group",
                          p.id === selectedProviderId
                            ? "bg-emerald-600/10 border-emerald-500/50 shadow-lg shadow-emerald-900/10"
                            : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                        )}
                      >
                        {p.id === selectedProviderId && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        )}
                        <div className="flex items-center justify-between w-full">
                           <span className={cn(
                             "text-[13px] font-black truncate tracking-tight transition-colors",
                             p.id === selectedProviderId ? "text-emerald-400" : "text-white/60 group-hover:text-white"
                           )}>{p.name}</span>
                           {p.isDefault && (
                             <div className="size-1.5 rounded-full bg-emerald-500 glow-emerald" />
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge className="bg-white/5 text-white/20 border-white/5 text-[8px] font-black h-4 px-1.5 rounded-md uppercase tracking-tighter">{p.type}</Badge>
                           {p.isDefault && <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Default</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
           </div>

           {/* Quick Stats Overhaul */}
           <div className="glass-panel border-white/5 rounded-3xl p-6 bg-gradient-to-br from-emerald-500/5 to-blue-500/5">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Network Integrity</p>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40">Latent Nodes</span>
                    <span className="text-xs font-black text-emerald-400">{providers.length}</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 glow-emerald" style={{ width: '85%' }} />
                 </div>
              </div>
           </div>
        </div>

        {/* Model Configuration View Overhaul */}
        <div className="lg:col-span-3">
          <Card className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20">
            <CardHeader className="p-10 border-b border-white/10 bg-white/[0.01]">
              <CardTitle className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                <Zap className="size-6 text-amber-500 animate-bounce" />
                Intelligence Tuning
              </CardTitle>
              <p className="text-xs text-white/40 font-bold italic mt-1">প্রোভাইডার মডেল কনফিগারেশন এবং ব্যবহারের ইতিহাস</p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {!selectedProvider ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                   <Layers className="size-16 mb-6" />
                   <p className="text-sm font-black uppercase tracking-[0.3em]">Standby for selection</p>
                </div>
              ) : loadingModels ? (
                <div className="space-y-6">
                  <Skeleton className="h-14 w-full rounded-2xl bg-white/5" />
                  <Skeleton className="h-40 w-full rounded-[2rem] bg-white/5" />
                </div>
              ) : providerDetailsError ? (
                <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-red-400 font-mono text-xs break-all shadow-inner">
                  SIGNAL_FAILED: {providerDetailsError}
                </div>
              ) : !providerDetails ? (
                <div className="p-20 text-center opacity-10 italic font-black uppercase">Zero Signal Data</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-6 flex-wrap bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-white tracking-tight">
                        {providerDetails.provider.name}
                      </div>
                      <div className="text-[10px] text-white/20 font-mono break-all font-black uppercase tracking-[0.1em]">
                        ENDPOINT_ADDR_ {providerDetails.provider.endpoint || "DYNAM_INTERNAL"}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Decrypted Payloads</p>
                         <div className="flex items-center justify-end gap-2">
                           <Hash className="size-4 text-emerald-500/60" />
                           <span className="text-xl font-black text-white font-mono">{providerDetails.usage.messages}</span>
                         </div>
                      </div>
                      <div className="h-10 w-px bg-white/5" />
                      <div className="text-right">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Last Resonance</p>
                         <div className="flex items-center justify-end gap-2 text-white font-medium italic text-xs">
                           <Clock className="size-4 text-amber-500/60" />
                           {providerDetails.usage.lastUsedAt
                            ? new Date(providerDetails.usage.lastUsedAt).toLocaleTimeString()
                            : "ZERO_RECORD"}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="size-2 rounded-full bg-emerald-500 glow-emerald" />
                       <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2rem]">Default Intelligence Lock</h4>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-[1.25rem] w-full sm:w-[480px] text-sm font-bold text-white px-6 focus:ring-emerald-500/30">
                          <SelectValue placeholder="Select high-fidelity model..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0f14] border-white/10 text-white font-bold">
                          {(providerDetails.runtime.models || []).map((m) => (
                            <SelectItem key={m} value={m} className="focus:bg-emerald-500/20 py-3">
                              {m}
                            </SelectItem>
                          ))}
                          {providerDetails.runtime.models.length === 0 && (
                            <SelectItem value="none" disabled>
                              Zero Logic Paths Found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleSaveDefaultModel}
                        disabled={saving || !selectedModel}
                        className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20"
                      >
                        {saving ? <RefreshCw className="size-5 animate-spin" /> : "Anchor Node"}
                      </Button>

                      {!providerDetails.runtime.supported && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase px-4 h-14 flex items-center rounded-2xl tracking-tighter italic">
                           Hardware Limitation: Manual Mapping Only
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="size-2 rounded-full bg-blue-500 glow-blue" />
                       <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2rem]">Runtime Discovery Grid</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
                      {(providerDetails.runtime.models || []).slice(0, 100).map((m) => (
                        <Badge
                          key={m}
                          variant={m === providerDetails.provider.model ? "default" : "outline"}
                          className={cn(
                            "h-9 px-4 rounded-xl text-[10px] font-black font-mono transition-all uppercase tracking-tighter flex items-center gap-2",
                            m === providerDetails.provider.model 
                              ? "bg-emerald-600 border-none shadow-lg shadow-emerald-900/50" 
                              : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/60 hover:bg-white/[0.05]"
                          )}
                        >
                          {m === providerDetails.provider.model && <div className="size-1.5 rounded-full bg-white glow" />}
                          {m}
                        </Badge>
                      ))}
                      {providerDetails.runtime.models.length === 0 && (
                        <div className="text-xs text-white/10 font-black italic uppercase tracking-widest py-10 w-full text-center">No runtime artifacts detected in spectrum</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
