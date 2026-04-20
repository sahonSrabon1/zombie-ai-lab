"use client";

import { useEffect, useState } from "react";
import { HealthBadge } from "./health-badge";
import { useTheme } from "next-themes";
import { Moon, Sun, Github, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TabId } from "./sidebar";

interface HeaderProps {
  activeTab: TabId;
  healthStatus?: {
    database?: "healthy" | "unhealthy" | "degraded" | "unknown";
    stockServer?: "healthy" | "unhealthy" | "degraded" | "unknown";
    overall?: "healthy" | "unhealthy" | "degraded" | "unknown";
  };
}

const tabTitles: Record<TabId, string> = {
  dashboard: "Dashboard",
  providers: "Providers",
  models: "Models",
  agents: "Agents",
  chat: "Chat",
  memory: "Memory",
  mcp: "MCP Tools",
  settings: "Settings",
};

export function Header({ activeTab, healthStatus }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <header className="flex items-center justify-between h-20 px-8 border-b border-white/5 bg-[#0d0f14]/40 backdrop-blur-md shrink-0 relative z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black text-white/90 tracking-tight">
          {tabTitles[activeTab]}
        </h1>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[9px] font-black uppercase tracking-widest text-emerald-500 border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 h-5"
          >
            Masood v1.0
          </Badge>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
              Secure Link Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Health indicators */}
        {healthStatus && (
          <div className="hidden lg:flex items-center gap-3 mr-4 p-1.5 px-3 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            {healthStatus.database && (
              <HealthBadge status={healthStatus.database} label="SYSTEM.DB" />
            )}
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            {healthStatus.stockServer && (
              <HealthBadge
                status={healthStatus.stockServer}
                label="ENGINE.CORE"
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-white/5 pl-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                asChild
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-4.5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-emerald-950 border-emerald-500/30">
              Source Architecture
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {isMounted && theme === "dark" ? (
                  <Sun className="size-4.5 text-amber-400" />
                ) : (
                  <Moon className="size-4.5 text-blue-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-emerald-950 border-emerald-500/30">
              Shift Visual Layer
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
