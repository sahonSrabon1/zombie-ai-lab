"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, type TabId } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ProvidersPanel } from "@/components/dashboard/providers-panel";
import { ModelsPanel } from "@/components/dashboard/models-panel";
import { AgentsPanel } from "@/components/dashboard/agents-panel";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { MemoryPanel } from "@/components/dashboard/memory-panel";
import { McpPanel } from "@/components/dashboard/mcp-panel";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skull } from "lucide-react";

interface HealthStatus {
  database?: "healthy" | "unhealthy" | "degraded" | "unknown";
  stockServer?: "healthy" | "unhealthy" | "degraded" | "unknown";
  overall?: "healthy" | "unhealthy" | "degraded" | "unknown";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | undefined>();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const loadHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok && mountedRef.current) {
          const json = await res.json();
          const data = json.data || json;
          const services = data.services || data;
          setHealthStatus({
            database: services.database as HealthStatus["database"],
            stockServer: services.stockServer as HealthStatus["stockServer"],
            overall: data.status as HealthStatus["overall"],
          });
        }
      } catch {
        // Silently fail
      }
    };

    void loadHealth();
    const interval = setInterval(() => { void loadHealth(); }, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const renderPanel = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "providers":
        return <ProvidersPanel />;
      case "models":
        return <ModelsPanel />;
      case "agents":
        return <AgentsPanel />;
      case "chat":
        return (
          <div className="h-[calc(100vh-8.5rem)] min-h-[500px]">
            <ChatPanel />
          </div>
        );
      case "memory":
        return <MemoryPanel />;
      case "mcp":
        return <McpPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header activeTab={activeTab} healthStatus={healthStatus} />

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <main className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </main>
        </ScrollArea>

        {/* Footer */}
        <footer className="flex items-center justify-between h-8 px-6 border-t border-border bg-card text-[10px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5">
            <Skull className="size-3 text-emerald-400" />
            <span>ZombieCoder Agentic Hub</span>
            <span className="text-border">|</span>
            <span>Developer Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()}</span>
            <span className="text-border">|</span>
            <span>Sahon Srabon</span>
            <span className="text-border">|</span>
            <span>Dhaka, Bangladesh</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
