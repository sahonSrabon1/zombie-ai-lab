"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  Clock,
  Hash,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  tokens?: number;
  latency?: number;
}

interface AgentOption {
  id: string;
  name: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [agentId, setAgentId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sending, setSending] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchOptions = useCallback(async () => {
    try {
      const [agentsRes, providersRes] = await Promise.allSettled([
        fetch("/api/agents"),
        fetch("/api/providers"),
      ]);
      if (agentsRes.status === "fulfilled" && agentsRes.value.ok) {
        const json = await agentsRes.value.json();
        const list = json.data || json || [];
        setAgents(
          list.map((a: AgentOption) => ({ id: a.id, name: a.name }))
        );
        if (list.length > 0 && !agentId) {
          setAgentId(list[0].id);
        }
      }
      if (providersRes.status === "fulfilled" && providersRes.value.ok) {
        const json = await providersRes.value.json();
        const list = json.data || json || [];
        setProviders(
          list.map((p: ProviderOption) => ({ id: p.id, name: p.name }))
        );
        if (list.length > 0 && !providerId) {
          setProviderId(list[0].id);
        }
      }
    } catch {
      // Silently fail forensic link
    }
  }, [agentId, providerId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      if (useStreaming) {
        const assistantIdx = messages.length + 1; // optimistic index (after user message)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
          },
        ]);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage.content }],
            agentId: agentId || undefined,
            providerId: providerId || undefined,
            sessionId: sessionId || undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => '');
          throw new Error(err || `Streaming request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalMeta: { tokenCount?: number; latencyMs?: number } | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            const eventLine = lines.find((l) => l.startsWith('event: '));
            const dataLine = lines.find((l) => l.startsWith('data: '));
            const event = eventLine ? eventLine.slice('event: '.length).trim() : 'message';
            const dataStr = dataLine ? dataLine.slice('data: '.length) : '';

            let payload: any = null;
            try {
              payload = dataStr ? JSON.parse(dataStr) : null;
            } catch {
              payload = dataStr;
            }

            if (event === 'session' && payload?.sessionId) {
              setSessionId(payload.sessionId);
            }

            if (event === 'chunk' && payload?.content) {
              const delta = String(payload.content);
              setMessages((prev) => {
                const copy = [...prev];
                const target = copy[assistantIdx];
                if (target && target.role === 'assistant') {
                  copy[assistantIdx] = {
                    ...target,
                    content: (target.content || '') + delta,
                  };
                }
                return copy;
              });
            }

            if (event === 'done') {
              finalMeta = {
                tokenCount: payload?.tokenCount,
                latencyMs: payload?.latencyMs,
              };
            }

            if (event === 'error') {
              const msg = payload?.error || 'Streaming error';
              throw new Error(msg);
            }
          }
        }

        if (finalMeta) {
          setMessages((prev) => {
            const copy = [...prev];
            const target = copy[assistantIdx];
            if (target && target.role === 'assistant') {
              copy[assistantIdx] = {
                ...target,
                tokens: finalMeta?.tokenCount,
                latency: finalMeta?.latencyMs,
              };
            }
            return copy;
          });
        }
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: input.trim() }],
            agentId: agentId || undefined,
            providerId: providerId || undefined,
            sessionId: sessionId || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const response = data.data || data;
          if (response.sessionId) {
            setSessionId(response.sessionId);
          }
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: response.content || response.response || response.message || "No forensic receipt.",
            timestamp: response.timestamp || new Date().toISOString(),
            tokens: response.tokenCount || response.tokens,
            latency: response.latencyMs || response.latency,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const err = await res.json();
          const errorMsg: ChatMessage = {
            role: "system",
            content: `Forensic Alert: ${err.error || "Communication severed"}`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          toast.error(err.error || "Signal failure");
        }
      }
    } catch {
      const errorMsg: ChatMessage = {
        role: "system",
        content: "Forensic Failure: The engine is unreachable.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error("Network void detected");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId("");
    toast.success("Forensic history scrubbed");
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-2">
      {/* Chat Controls Overhaul */}
      <div className="flex items-center gap-4 flex-wrap bg-white/[0.02] border border-white/5 p-2 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-[200px] group">
          <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:glow-emerald transition-all shadow-inner">
             <Bot className="size-4 text-emerald-400" />
          </div>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-full h-10 bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white/80 focus:ring-emerald-500/30">
              <SelectValue placeholder="Intelligence Unit" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs focus:bg-emerald-500/20">
                  {a.name}
                </SelectItem>
              ))}
              {agents.length === 0 && (
                <SelectItem value="none" disabled>
                  Zero Entities Online
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[200px] group">
          <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:glow-gold transition-all shadow-inner">
             <Zap className="size-4 text-amber-400" />
          </div>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className="w-full h-10 bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white/80 focus:ring-amber-500/30">
              <SelectValue placeholder="Synapse Bridge" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] border-white/10 text-white">
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs focus:bg-amber-500/20">
                  {p.name}
                </SelectItem>
              ))}
              {providers.length === 0 && (
                <SelectItem value="none" disabled>
                   No Infrastructure Active
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
            <Button
              variant={useStreaming ? "default" : "outline"}
              size="sm"
              onClick={() => setUseStreaming((v) => !v)}
              className={cn(
                "h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                useStreaming ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30" : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              Stream {useStreaming ? "ON" : "OFF"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="size-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
              title="Scrub Buffer"
            >
              <Trash2 className="size-4" />
            </Button>
        </div>
      </div>

      {/* Messages Area Overhaul */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          
          <ScrollArea className="flex-1 p-6">
          <div ref={scrollRef} className="space-y-8 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground animate-in fade-in duration-1000">
                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                   <MessageSquare className="size-8 opacity-20" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Awaiting Dialogue</p>
                <p className="text-[10px] mt-4 italic font-medium opacity-40">
                   ইনপুট প্রদানের মাধ্যমে ফরেনসিক ডায়ালগ চালু করুন
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                        "flex gap-4 group",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                        className={cn(
                            "flex items-center justify-center size-10 rounded-2xl shrink-0 border transition-all shadow-lg",
                            msg.role === "user" 
                              ? "bg-blue-600/10 border-blue-600/20 text-blue-400"
                              : msg.role === "assistant"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:glow-emerald"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="size-5" />
                        ) : msg.role === "user" ? (
                           <User className="size-5" />
                        ) : (
                          <Zap className="size-5" />
                        )}
                      </div>

                    <div
                      className={cn(
                        "max-w-[85%] rounded-[2rem] px-6 py-4 relative group-hover:shadow-2xl transition-all duration-500",
                        msg.role === "user"
                          ? "bg-blue-600/10 text-white rounded-tr-none border border-blue-600/20"
                          : msg.role === "system"
                          ? "bg-red-500/10 text-red-200 border border-red-500/20 rounded-tl-none font-mono text-[11px]"
                          : "bg-white/[0.03] text-white/90 border border-white/10 rounded-tl-none backdrop-blur-md"
                      )}
                    >
                      {/* Subtitle for assistant messages */}
                      {msg.role === "assistant" && idx === messages.length - 1 && sending && (
                         <div className="absolute -top-6 left-0 text-[10px] font-black text-emerald-500/60 uppercase tracking-widest animate-pulse">
                            Generating Forensic Evidence...
                         </div>
                      )}

                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>

                      <div className={cn(
                        "flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-[9px] font-black tracking-widest uppercase",
                        msg.role === "user" ? "justify-end text-blue-400/50" : "text-white/20"
                      )}>
                        {msg.timestamp && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3" />
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        )}
                        {msg.tokens && (
                          <span className="inline-flex items-center gap-1.5 border-l border-white/5 pl-4">
                            <Hash className="size-3 text-emerald-500/50" />
                            {msg.tokens} TOKENS
                          </span>
                        )}
                        {msg.latency && (
                          <span className="inline-flex items-center gap-1.5 border-l border-white/5 pl-4">
                            <Zap className="size-3 text-amber-500/50" />
                            {msg.latency}MS
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {sending && !useStreaming && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center glow-emerald shadow-lg">
                      <Bot className="size-5 text-emerald-400 animate-bounce" />
                    </div>
                    <div className="bg-white/5 rounded-[2rem] rounded-tl-none px-6 py-4 border border-white/10 flex items-center gap-3 backdrop-blur-md">
                        <Loader2 className="size-4 animate-spin text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500/60">Forensic Search In Progress</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Input Area Overhaul */}
        <div className="p-6 bg-white/[0.02] border-t border-white/10 backdrop-blur-xl">
          <div className="relative group">
            {/* Pulsing input border glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/30 to-blue-600/30 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            
            <div className="relative flex items-end gap-3 bg-black/60 rounded-[2rem] p-2 border border-white/10 group-focus-within:border-emerald-500/50 transition-all shadow-2xl">
                <Textarea
                  ref={inputRef}
                  placeholder="Execute model logic sequence..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[50px] max-h-[200px] resize-none text-sm font-medium bg-transparent border-none focus-visible:ring-0 px-4 py-3 text-white placeholder:text-white/20 forensic-scroll"
                  rows={1}
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className={cn(
                    "size-12 rounded-full shrink-0 transition-all duration-300 transform",
                    sending ? "bg-amber-600" : "bg-emerald-600 hover:bg-emerald-500 hover:scale-110 active:scale-95 shadow-lg shadow-emerald-900/30"
                  )}
                >
                  {sending ? (
                    <Loader2 className="size-6 animate-spin text-white" />
                  ) : (
                    <Send className="size-6 text-white ml-0.5" />
                  )}
                </Button>
            </div>
            <div className="mt-3 flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-widest text-white/10">
               <div className="flex items-center gap-2">
                  <span className="text-emerald-500/20">CTRL + ENTER TO EXECUTE</span>
                  <span className="text-white/5">|</span>
                  <span className="text-emerald-500/20">SHIFT + ENTER FOR SYNAPSE BREAK</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <Hash className="size-2.5" />
                  SESSION_ACTIVE: {sessionId.slice(0, 8) || "NULL"}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
