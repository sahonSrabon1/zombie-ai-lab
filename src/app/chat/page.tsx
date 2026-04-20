"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { MessageSquare, Plus, Send, Trash2, RefreshCw } from "lucide-react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  backendSessionId?: string;
  agentId?: string;
  agentName?: string;
  messages: ChatMessage[];
};

type AgentListItem = {
  id: string;
  name: string;
  type?: string;
  status?: string;
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PublicChatPage() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: uid(), title: "New Chat", createdAt: new Date().toISOString(), messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) ?? sessions[0],
    [sessions, currentSessionId],
  );

  const fetchAgents = async () => {
    setAgentsLoading(true);
    setAgentsError("");
    try {
      const res = await fetch("/api/agents", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        throw new Error(json?.error ? String(json.error) : `Failed to load agents (${res.status})`);
      }
      const list = (json?.data || json?.agents || []) as AgentListItem[];
      setAgents(Array.isArray(list) ? list : []);
    } catch (err) {
      setAgents([]);
      setAgentsError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setAgentsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAgents();
  }, []);

  const createSession = (opts?: { agentId?: string }) => {
    const selectedAgent = opts?.agentId ? agents.find((a) => a.id === opts.agentId) : undefined;
    const s: ChatSession = {
      id: uid(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
      agentId: selectedAgent?.id,
      agentName: selectedAgent?.name,
    };
    setSessions((prev) => [s, ...prev]);
    setCurrentSessionId(s.id);
  };

  const removeSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fallback: ChatSession = {
          id: uid(),
          title: "New Chat",
          createdAt: new Date().toISOString(),
          messages: [],
        };
        setCurrentSessionId(fallback.id);
        return [fallback];
      }
      if (currentSessionId === id) setCurrentSessionId(next[0].id);
      return next;
    });
  };

  const updateSession = (sessionId: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
  };

  const setCurrentAgent = (agentId: string) => {
    const nextAgent = agentId ? agents.find((a) => a.id === agentId) : undefined;
    const agentName = nextAgent?.name;

    if (!currentSession) return;

    // If there's already a conversation, start a new local session to avoid mixing agents in one thread.
    if (currentSession.messages.length > 0) {
      createSession({ agentId: agentId || undefined });
      return;
    }

    updateSession(currentSession.id, (s) => ({
      ...s,
      agentId: agentId || undefined,
      agentName,
      backendSessionId: undefined,
    }));
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !currentSession || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantId = uid();
    updateSession(currentSession.id, (s) => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 28) : s.title,
      messages: [
        ...s.messages,
        userMsg,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date().toISOString() },
      ],
    }));

    try {
      const history = currentSession.messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
          agentId: currentSession.agentId,
          sessionId: currentSession.backendSessionId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const lines = block.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          const event = eventLine ? eventLine.slice(7).trim() : "message";
          let payload: any = {};
          if (dataLine) {
            try {
              payload = JSON.parse(dataLine.slice(6));
            } catch {
              payload = {};
            }
          }

          if (event === "session" && payload?.sessionId) {
            updateSession(currentSession.id, (s) => ({ ...s, backendSessionId: payload.sessionId as string }));
          }

          if (event === "chunk" && payload?.content) {
            const delta = String(payload.content);
            updateSession(currentSession.id, (s) => ({
              ...s,
              messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
            }));
          }

          if (event === "error") {
            throw new Error(payload?.error ? String(payload.error) : "Streaming error");
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      updateSession(currentSession.id, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === assistantId ? { ...m, content: `Sorry, failed to get a response.\n${message}` } : m,
        ),
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <aside className="hidden w-72 border-r border-zinc-800 bg-zinc-900/70 p-4 md:flex md:flex-col">
        <Button onClick={() => createSession()} className="justify-start gap-2">
          <Plus className="size-4" /> New Chat
        </Button>
        <div className="mt-4 space-y-2 overflow-y-auto">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group w-full rounded-lg p-3 text-left transition ${s.id === currentSessionId ? "bg-zinc-700" : "hover:bg-zinc-800"}`}
            >
              <p className="truncate text-sm font-semibold">{s.title}</p>
              {s.agentName ? (
                <p className="mt-1 truncate text-[11px] text-zinc-300">Agent: {s.agentName}</p>
              ) : (
                <p className="mt-1 truncate text-[11px] text-zinc-500">Agent: Default</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">{new Date(s.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setCurrentSessionId(s.id)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white"
                >
                  <MessageSquare className="size-3" /> Open
                </button>
                <button
                  onClick={() => removeSession(s.id)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <MessageSquare className="size-5 text-sky-400" />
          <h1 className="text-sm font-black tracking-widest">PUBLIC CHAT</h1>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={currentSession?.agentId ?? ""}
              onChange={(e) => setCurrentAgent(e.target.value)}
              disabled={loading || agentsLoading}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-sky-500"
              aria-label="Select agent"
              title={currentSession?.messages.length ? "Change agent starts a new chat session" : "Select an agent"}
            >
              <option value="">Default Agent</option>
              {agents
                .filter((a) => !a.status || a.status === "active")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.type ? ` · ${a.type}` : ""}
                  </option>
                ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchAgents()}
              disabled={agentsLoading}
              className="h-9 gap-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
            >
              <RefreshCw className={`size-4 ${agentsLoading ? "animate-spin" : ""}`} />
              Agents
            </Button>
          </div>
        </header>
        {agentsError ? (
          <div className="border-b border-zinc-800 px-4 py-2 text-xs text-red-300">
            Failed to load agents: {agentsError}
          </div>
        ) : null}

        <ScrollArea className="flex-1 px-4 py-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {currentSession?.messages.length ? (
              currentSession.messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <Card className={`max-w-[85%] px-4 py-3 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-zinc-800 text-zinc-100"}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (loading ? "Thinking..." : "")}</p>
                  </Card>
                </div>
              ))
            ) : (
              <div className="mx-auto mt-20 text-center text-zinc-400">
                <p className="text-lg font-semibold">Start a public chat</p>
                <p className="mt-2 text-sm">Send the first message to begin.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-zinc-800 p-4">
          <div className="mx-auto flex max-w-4xl gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={loading}
              placeholder="Write your message..."
              className="h-11 border-zinc-700 bg-zinc-900"
            />
            <Button onClick={() => void sendMessage()} disabled={loading || !input.trim()} className="h-11 gap-2">
              <Send className="size-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
