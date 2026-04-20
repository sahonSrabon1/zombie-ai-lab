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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  RefreshCw,
  Save,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Database,
  Globe,
  Bell,
  Palette,
  Terminal,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Setting {
  key: string;
  value: string;
  category?: string;
  description?: string;
  isSecret?: boolean;
  type?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const categoryIcons: Record<string, React.ElementType> = {
  general: Settings,
  security: Shield,
  database: Database,
  network: Globe,
  notifications: Bell,
  appearance: Palette,
  terminal: Terminal,
  api: Key,
};

const categoryColors: Record<string, string> = {
  general: "text-emerald-400 bg-emerald-500/15",
  security: "text-red-400 bg-red-500/15",
  database: "text-cyan-400 bg-cyan-500/15",
  network: "text-amber-400 bg-amber-500/15",
  notifications: "text-purple-400 bg-purple-500/15",
  appearance: "text-pink-400 bg-pink-500/15",
  terminal: "text-zinc-400 bg-zinc-500/15",
  api: "text-orange-400 bg-orange-500/15",
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json.settings || json || [];
        setSettings(
          Array.isArray(data)
            ? data
            : Object.entries(data).map(([key, value]) => ({
                key,
                value: String(value),
              }))
        );
      }
    } catch {
      toast.error("Settings matrix link failure");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValue }),
      });
      if (res.ok) {
        toast.success(`Node "${key}" synchronized`);
        setEditingKey(null);
        fetchSettings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Matrix synchronization error");
      }
    } catch {
      toast.error("Critical write error");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredSettings = settings.filter(
    (s) =>
      !searchQuery ||
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedSettings = filteredSettings.reduce(
    (acc, setting) => {
      const cat = setting.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(setting);
      return acc;
    },
    {} as Record<string, Setting[]>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tight flex items-center gap-3">
             <Settings className="size-8 text-emerald-400 animate-spin-slow" />
            System Control Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-bold italic">
             সিস্টেম প্যারামিটার এবং এনভায়রনমেন্ট কনফিগারেশন প্যানেল
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Filter logic nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 bg-white/5 border-white/10 rounded-xl pl-10 w-[240px] text-sm font-bold shadow-inner focus:border-emerald-500/50 transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSettings}
            className="size-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all font-black"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Settings Groups Overhaul */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-white/5" />
          ))}
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center opacity-10">
            <Settings className="size-20 mb-6" />
            <p className="text-xl font-black uppercase tracking-[0.3em]">No Context Nodes Detected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedSettings).map(([category, items], catIdx) => {
              const Icon = categoryIcons[category] || Settings;
              const colorClass = categoryColors[category] || categoryColors.general;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: catIdx * 0.1 }}
                >
                  <Card className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col bg-black/20 group hover:border-white/10 transition-all">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={cn("flex items-center justify-center size-12 rounded-2xl shadow-inner group-hover:scale-110 transition-transform", colorClass)}>
                              <Icon className="size-6" />
                            </div>
                            <div>
                               <CardTitle className="text-lg font-black uppercase tracking-widest text-white/80">
                                {category}
                               </CardTitle>
                               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                                 {items.length} ACTIVE_NODES
                               </p>
                            </div>
                         </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-2 flex-1">
                      {items.map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/item"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-black font-mono text-emerald-500/60 uppercase tracking-tighter">
                                {setting.key}
                              </p>
                              {setting.isSecret && (
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black px-1.5 h-4 rounded-md">
                                  SECRET
                                </Badge>
                              )}
                            </div>
                            {setting.description && (
                              <p className="text-[10px] text-white/30 font-bold italic mt-1 leading-tight line-clamp-1">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {editingKey === setting.key ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) =>
                                    setEditValue(e.target.value)
                                  }
                                  className="h-9 w-[180px] bg-black/40 border-emerald-500/30 text-xs font-mono rounded-xl focus:ring-emerald-500/20"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave(setting.key);
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  type={setting.isSecret && !showSecrets.has(setting.key) ? "password" : "text"}
                                  autoFocus
                                />
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    className="size-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                                    onClick={() => handleSave(setting.key)}
                                    disabled={saving}
                                  >
                                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-9 rounded-xl hover:bg-white/10"
                                    onClick={cancelEditing}
                                  >
                                    <span className="text-xl leading-none">×</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                   <div className="text-[11px] font-mono text-white/60 max-w-[140px] truncate">
                                      {setting.isSecret && !showSecrets.has(setting.key)
                                        ? "••••••••"
                                        : setting.value || "—"}
                                   </div>
                                </div>
                                <div className="flex items-center gap-1.5 ">
                                  {setting.isSecret && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 rounded-lg bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all"
                                      onClick={() => toggleSecret(setting.key)}
                                    >
                                      {showSecrets.has(setting.key) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                    onClick={() => startEditing(setting)}
                                  >
                                    <Settings className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Prompt Templates Section Overhaul */}
      <Card className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/10">
        <CardHeader className="p-10 border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-inner">
              <Terminal className="size-7 text-purple-400 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white uppercase tracking-widest">Logic Templates ARCHIVE</CardTitle>
              <p className="text-xs text-white/40 font-bold italic mt-1">সিস্টেম প্রম্পট এবং ইন্টেলিজেন্স টেমপ্লেটসমূহ</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
               Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5" />)
            ) : Object.keys(settings).length === 0 ? (
               <div className="col-span-2 py-20 text-center opacity-10 font-black uppercase tracking-widest">Zero Directive Sets</div>
             ) : (
                <>
                  {/* This would be the mapping of templates if the data remains compatible */}
                  <div className="col-span-2">
                      <PromptTemplatesSection />
                  </div>
                </>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PromptTemplatesSection() {
  const [templates, setTemplates] = useState<
    Array<{ id?: string; name?: string; description?: string; template?: string; [key: string]: unknown }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/prompt-templates");
        if (res.ok) {
          const json = await res.json();
          setTemplates(json.data || json.templates || json || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {loading ? (
        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5" />)
      ) : templates.length === 0 ? (
        <div className="col-span-2 py-20 text-center opacity-10 italic font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-[2.5rem]">
          No directive artifacts detected
        </div>
      ) : (
        templates.map((tpl, idx) => (
          <motion.div
            key={tpl.id || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all flex flex-col group overflow-hidden relative shadow-lg"
          >
            <div className="absolute inset-0 bg-purple-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-sm font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">
                {tpl.name || `TEMPLATE_IDX_${idx.toString().padStart(3, '0')}`}
              </p>
              <Badge className="bg-purple-500/10 text-purple-400 border-none text-[8px] font-black h-4 uppercase px-1.5 opacity-40 group-hover:opacity-100 transition-all">DIRECTIVE</Badge>
            </div>
            {tpl.description && (
              <p className="text-[10px] text-white/30 font-bold italic mb-4 leading-relaxed relative z-10">
                {tpl.description}
              </p>
            )}
            {tpl.template && (
              <div className="relative group/pre">
                <pre className="p-4 rounded-2xl bg-black/60 text-[10px] font-mono text-emerald-500/60 overflow-x-auto max-h-[100px] overflow-y-auto forensic-scroll border border-white/5 group-hover/pre:border-purple-500/20 transition-all">
                  {tpl.template}
                </pre>
                <div className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500/40 animate-pulse" />
              </div>
            )}
            <div className="mt-4 flex justify-end relative z-10">
               <span className="text-[8px] font-black text-white/5 uppercase tracking-widest">Template_Hash: {Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
