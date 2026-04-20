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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Brain,
  FileText,
  Clock,
  MessageSquare,
  Bot,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryEntry {
  id: string;
  topic?: string;
  content?: string;
  type?: string;
  agentId?: string;
  importance?: number;
  agent?: { id: string; name: string } | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface SessionEntry {
  id: string;
  title?: string;
  status?: string;
  agentId?: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  _count?: { messages: number };
  [key: string]: unknown;
}

interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface AgentOption {
  id: string;
  name: string;
}

export function MemoryPanel() {
  const [agentMemories, setAgentMemories] = useState<MemoryEntry[]>([]);
  const [individualMemories, setIndividualMemories] = useState<MemoryEntry[]>(
    []
  );
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionEntry | null>(
    null
  );
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<"agent" | "individual">("agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    agentId: "",
    topic: "",
    content: "",
    type: "conversation",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [agentRes, indivRes, sessionsRes, agentsRes] = await Promise.allSettled([
        fetch("/api/memory/agent"),
        fetch("/api/memory/individual"),
        fetch("/api/sessions"),
        fetch("/api/agents"),
      ]);
      if (agentRes.status === "fulfilled" && agentRes.value.ok) {
        const json = await agentRes.value.json();
        const d = json.data;
        setAgentMemories(Array.isArray(d?.memories) ? d.memories : Array.isArray(d) ? d : Array.isArray(json) ? json : []);
      }
      if (indivRes.status === "fulfilled" && indivRes.value.ok) {
        const json = await indivRes.value.json();
        const d = json.data;
        setIndividualMemories(Array.isArray(d?.memories) ? d.memories : Array.isArray(d) ? d : Array.isArray(json) ? json : []);
      }
      if (sessionsRes.status === "fulfilled" && sessionsRes.value.ok) {
        const json = await sessionsRes.value.json();
        const d = json.data;
        setSessions(Array.isArray(d?.sessions) ? d.sessions : Array.isArray(d) ? d : Array.isArray(json) ? json : []);
      }
      if (agentsRes.status === "fulfilled" && agentsRes.value.ok) {
        const json = await agentsRes.value.json();
        const list = json.data || json || [];
        setAgents(
          Array.isArray(list)
            ? list.map((a: AgentOption) => ({ id: a.id, name: a.name }))
            : []
        );
      }
    } catch {
      toast.error("Memory matrix link failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchSessionMessages = async (sessionId: string) => {
    setSessionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const json = await res.json();
        const session = json.data || json;
        setSelectedSession(session);
        setSessionMessages(session.messages || []);
      }
    } catch {
      toast.error("Session retrieval failure");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (addType === "agent" && !formData.agentId) {
      toast.error("Agent linkage required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Empty data packet");
      return;
    }
    try {
      const url =
        addType === "agent" ? "/api/memory/agent" : "/api/memory/individual";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Synaptic bridge established");
        setAddDialogOpen(false);
        setFormData({ agentId: "", topic: "", content: "", type: "conversation" });
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Memory rejection");
      }
    } catch {
      toast.error("Matrix write error");
    }
  };

  const handleDeleteMemory = async (
    type: "agent" | "individual",
    id: string
  ) => {
    try {
      const url = `/api/memory/${type}/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        toast.success("Memory purged");
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Purge protocol failed");
      }
    } catch {
      toast.error("Delete command error");
    }
  };

  const getAgentName = (agentId?: string | null): string => {
    if (!agentId) return "Ghost Presence";
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : "UNIT_" + agentId.slice(0, 8);
  };

  const filteredAgentMemories = agentMemories.filter(
    (m) =>
      !searchQuery ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAgentName(m.agentId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIndividualMemories = individualMemories.filter(
    (m) =>
      !searchQuery ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MemoryRow = ({
    memory,
    type,
    index,
  }: {
    memory: MemoryEntry;
    type: "agent" | "individual";
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-start justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all shadow-xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex-1 min-w-0 mr-4 relative z-10">
        {/* Agent Identity Overhaul */}
        {type === "agent" && memory.agentId && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner group-hover:glow-emerald transition-all">
              <Bot className="size-4 text-emerald-400" />
            </div>
            <div>
               <span className="text-xs font-black text-emerald-400 group-hover:text-emerald-300 transition-colors uppercase tracking-tight">
                {memory.agent?.name || getAgentName(memory.agentId)}
              </span>
              <div className="text-[9px] font-mono text-white/20 mt-0.5">ID: {memory.agentId.slice(0, 16)}...</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {memory.topic && (
            <Badge className="bg-white/5 text-white/60 border-white/10 text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-lg group-hover:bg-white/10 transition-all">
              {memory.topic}
            </Badge>
          )}
          {memory.type && (
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-lg border-white/5 bg-black/20 text-white/40">
              {memory.type}
            </Badge>
          )}
          {memory.importance != null && (
            <Badge className="text-[9px] font-black tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20 h-5 px-2 rounded-lg">
              SYNC_WEIGHT: {memory.importance}
            </Badge>
          )}
        </div>
        <p className="text-sm text-white/80 leading-relaxed font-medium italic group-hover:text-white transition-colors">
          &quot;{memory.content}&quot;
        </p>
        {memory.createdAt && (
          <div className="flex items-center gap-1.5 text-[9px] text-white/20 mt-4 font-black tracking-widest uppercase">
            <Clock className="size-3" />
            RECORDED_{new Date(memory.createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl bg-white/5 border border-white/10 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 relative z-10"
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#0a0b0d] border-white/10 text-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight">Purge Logic Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 font-medium">
              This action will permanently wipe this memory from the neural archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/5 rounded-xl hover:bg-white/10 hover:text-white transition-all">Abort</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteMemory(type, memory.id)}
              className="bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition-all"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Overhaul */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tight flex items-center gap-3">
             <Brain className="size-8 text-emerald-400 animate-pulse" />
            Neural Archive Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-bold italic">
             এজেন্টদের শিখানো তথ্য এবং তাদের বুদ্ধিমত্তার ডেটাবেজ
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Search Archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 bg-white/5 border-white/10 rounded-xl pl-10 w-[240px] text-sm font-bold shadow-inner focus:border-emerald-500/50 transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAll}
            className="size-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all font-black"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Dialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20">
                <Plus className="size-4 mr-2" />
                Forge Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0f0d] border-white/10 text-white rounded-[2.5rem] shadow-2xl p-8 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Manual Synapse Forge</DialogTitle>
                <DialogDescription className="text-white/40 font-medium">
                  Create a custom logic imprint for deployment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 font-bold">
                <div className="space-y-2">
                  <Label className="uppercase tracking-[0.2em] text-[10px] text-white/20">Archive Target</Label>
                  <Select
                    value={addType}
                    onValueChange={(v) => {
                      setAddType(v as "agent" | "individual");
                      setFormData({ ...formData, agentId: "" });
                    }}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0f14] border-white/10 text-white font-bold">
                      <SelectItem value="agent" className="focus:bg-emerald-500/20">Targeted Agent Synapse</SelectItem>
                      <SelectItem value="individual" className="focus:bg-blue-500/20">Individual Global Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {addType === "agent" && (
                  <div className="space-y-2">
                    <Label className="uppercase tracking-[0.2em] text-[10px] text-white/20">Identity Selection</Label>
                    {agents.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-500/70 italic">
                        <AlertCircle className="size-5 shrink-0" />
                        <span>Zero valid agents registered in matrix.</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.agentId}
                        onValueChange={(v) =>
                          setFormData({ ...formData, agentId: v })
                        }
                      >
                        <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl">
                          <SelectValue placeholder="Link with Engine..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0f14] border-white/10 text-white font-bold">
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id} className="focus:bg-emerald-500/20">
                              <div className="flex items-center gap-3">
                                <Bot className="size-4 text-emerald-400" />
                                {agent.name}
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter bg-white/5 px-1.5 rounded">
                                  {agent.id.slice(0, 12)}...
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="uppercase tracking-[0.2em] text-[10px] text-white/20">Imprint Topic</Label>
                  <Input
                    placeholder="e.g. CORE_LOGIC"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="h-12 bg-white/5 border-white/5 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase tracking-[0.2em] text-[10px] text-white/20">Synaptic Payload</Label>
                  <Textarea
                    placeholder="Describe the logic imprint..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={4}
                    className="bg-white/5 border-white/5 rounded-3xl"
                  />
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setAddDialogOpen(false)}
                  className="h-12 rounded-2xl font-black uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Abort
                </Button>
                <Button onClick={handleAddMemory} className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest shadow-xl">
                  Deploy SYNAPSE
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row Overhaul */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Neural Traces",
            value: agentMemories.length,
            icon: Brain,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Surface Data",
            value: individualMemories.length,
            icon: FileText,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: "Active Sessions",
            value: sessions.length,
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
        ].map((item) => (
          <motion.div 
            key={item.label} 
            whileHover={{ scale: 1.02 }}
            className={cn("glass-card rounded-3xl p-6 border transition-all shadow-xl hover:shadow-2xl", item.bg)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                <div className="text-3xl font-black text-white font-mono">
                  {loading ? <Skeleton className="h-9 w-16 bg-white/5" /> : item.value}
                </div>
              </div>
              <div className={cn("size-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group", item.bg)}>
                 <item.icon className={cn("size-7 transition-transform group-hover:scale-110", item.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs Overhaul */}
      <Tabs defaultValue="agent" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[1.5rem] h-14">
          <TabsTrigger value="agent" className="rounded-2xl px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-xs transition-all">
            <Brain className="size-4 mr-2" />
            Neural Registry
          </TabsTrigger>
          <TabsTrigger value="individual" className="rounded-2xl px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-xs transition-all">
            <FileText className="size-4 mr-2" />
            Global Context
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-2xl px-8 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-black text-xs transition-all">
            <Clock className="size-4 mr-2" />
             Forensic Timeline
          </TabsTrigger>
        </TabsList>

        {/* Neural Registry Tab Overhaul */}
        <TabsContent value="agent" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-10 border-b border-white/5 bg-white/[0.01] flex items-center justify-between px-10">
               <div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase">Embedded Synthetic Intelligence</h3>
                  <p className="text-xs text-white/40 font-bold italic mt-1">নির্দিষ্ট এজেন্টদের মধ্যে সংরক্ষিত কৃত্রিম স্মৃতি এবং যুক্তি</p>
               </div>
               <Badge className="bg-emerald-500/10 text-emerald-400 border-white/5 font-black px-4 h-8 uppercase tracking-widest">{filteredAgentMemories.length} UNITS</Badge>
            </div>
            <ScrollArea className="flex-1 max-h-[600px] bg-black/20">
               <div className="p-8 space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)
                  ) : filteredAgentMemories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-10">
                      <Brain className="size-16 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Registry Void</p>
                    </div>
                  ) : (
                    filteredAgentMemories.map((memory, i) => (
                      <MemoryRow key={memory.id} memory={memory} type="agent" index={i} />
                    ))
                  )}
               </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Individual Context Tab Overhaul */}
        <TabsContent value="individual" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5 bg-white/[0.01]">
               <h3 className="text-xl font-black text-white tracking-widest uppercase">Global Fact Resonance</h3>
               <p className="text-xs text-white/40 font-bold italic mt-1">সিস্টেমের সাধারণ ব্যবহারকারী ভিত্তিক স্মৃতি আর্কাইভ</p>
            </div>
            <ScrollArea className="flex-1 max-h-[600px]">
               <div className="p-8 space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)
                  ) : filteredIndividualMemories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-10">
                      <FileText className="size-16 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Global Void</p>
                    </div>
                  ) : (
                    filteredIndividualMemories.map((memory, i) => (
                      <MemoryRow key={memory.id} memory={memory} type="individual" index={i} />
                    ))
                  )}
               </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Forensic Timeline Tab Overhaul */}
        <TabsContent value="sessions" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[700px]">
            {/* Session Navigation Overhaul */}
            <div className="lg:col-span-2 glass-panel border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden bg-black/40">
              <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-lg font-black text-white tracking-widest uppercase">Archive Logs</h3>
                <p className="text-[10px] text-white/20 font-bold uppercase mt-1 tracking-tighter">ঐতিহাসিক ডায়ালগ এবং সেশন তালিকা</p>
              </div>
              <ScrollArea className="flex-1 forensic-scroll">
                <div className="p-6 space-y-3">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-3xl bg-white/5" />)
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-20 opacity-10">
                      <Clock className="size-12 mx-auto mb-4" />
                      <p className="text-xs font-black italic">Zero Session Artifacts</p>
                    </div>
                  ) : (
                    sessions.map((session, i) => (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => fetchSessionMessages(session.id)}
                        className={cn(
                          "w-full text-left p-5 rounded-[2rem] border transition-all relative group overflow-hidden",
                          selectedSession?.id === session.id
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-900/10"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                        )}
                      >
                         {/* Selection accent */}
                         {selectedSession?.id === session.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                         )}

                        <div className="flex items-center justify-between relative z-10">
                          <p className={cn(
                            "text-sm font-black tracking-tight",
                            selectedSession?.id === session.id ? "text-white" : "text-white/60 group-hover:text-white"
                          )}>
                            {session.title || `LOG_SEQ_${session.id.slice(0, 8)}`}
                          </p>
                          <Badge className={cn(
                            "text-[8px] font-black tracking-widest h-5 px-2 rounded-lg",
                            session.status === "active" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-white/20"
                          )}>
                            {session.status?.toUpperCase() || "STORED"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-[9px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/20 transition-colors">
                          <span className="inline-flex items-center gap-1.5">
                            <MessageSquare className="size-3" />
                            {session._count?.messages ?? session.messageCount ?? 0} PAYLOADS
                          </span>
                          {session.createdAt && (
                            <span className="inline-flex items-center gap-1.5 border-l border-white/5 pl-4">
                              <Clock className="size-3" />
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    )))}
                  </div>
              </ScrollArea>
            </div>

            {/* Session Payload Viewer Overhaul */}
            <div className="lg:col-span-3 glass-panel border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden bg-[#050608]">
              <div className="p-8 border-b border-white/10 bg-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                      <MessageSquare className="size-6 text-emerald-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-white tracking-widest uppercase shadow-emerald-900/10">Payload Decryption</h3>
                     <p className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-tighter">সেশন মেসেজসমূহের বিস্তারিত পর্যালোচনা</p>
                   </div>
                </div>
                {sessionLoading && <Loader2 className="size-5 animate-spin text-emerald-500" />}
              </div>
              <ScrollArea className="flex-1 p-8 forensic-scroll">
                {!selectedSession ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/10 italic space-y-6">
                    <div className="size-20 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center">
                       <MessageSquare className="size-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em]">Select Log Sequence</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sessionMessages.length === 0 ? (
                      <p className="text-xs text-white/20 text-center py-20 italic font-black uppercase tracking-widest bg-white/[0.01] rounded-3xl border border-white/5">
                        Zero Payload Captured In This Cycle
                      </p>
                    ) : (
                      sessionMessages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                             "p-6 rounded-3xl border transition-all shadow-md group",
                             msg.role === "user" ? "bg-emerald-500/5 border-emerald-500/20 mr-12" : "bg-white/[0.02] border-white/5 ml-12"
                          )}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className={cn(
                              "size-8 rounded-xl flex items-center justify-center border transition-all shadow-inner",
                              msg.role === "user" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 group-hover:glow-emerald" : "bg-white/5 border-white/10 text-white/30"
                            )}>
                              {msg.role === "user" ? <Bot className="size-4" /> : <User className="size-4" />}
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-[0.2em]",
                              msg.role === "user" ? "text-emerald-400" : "text-white/20"
                            )}>{msg.role === "user" ? "Intelligence_Sync" : "User_Signal"}</span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-white/80 font-medium italic">
                            &quot;{msg.content}&quot;
                          </p>
                          <div className="mt-4 pt-3 border-t border-white/[0.02] flex justify-end">
                             <div className="text-[9px] font-mono text-white/10 uppercase font-black">IMPRINT_SEQ_{idx.toString().padStart(3, '0')}</div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
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
