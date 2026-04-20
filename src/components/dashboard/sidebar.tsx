"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Layers,
  Bot,
  MessageSquare,
  Brain,
  Wrench,
  Settings,
  Skull,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

export type TabId =
  | "dashboard"
  | "providers"
  | "models"
  | "agents"
  | "chat"
  | "memory"
  | "mcp"
  | "settings";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "providers", label: "Providers", icon: Server },
  { id: "models", label: "Models", icon: Layers },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "mcp", label: "MCP Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col h-full border-r border-white/5 bg-[#0d0f14]/80 backdrop-blur-xl text-sidebar-foreground overflow-hidden shrink-0 relative z-50 shadow-2xl"
    >
      {/* Mesh Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Logo / Brand */}
      <div className="flex items-center gap-4 px-6 h-20 shrink-0 relative">
        <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 shrink-0 border border-emerald-500/30 status-active-glow">
          <Skull className="size-6" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-lg font-black tracking-tight text-white leading-none">
                Zombie<span className="text-emerald-500">Coder</span>
              </div>
              <div className="text-[10px] text-emerald-500/50 uppercase tracking-[0.2em] font-bold mt-1">
                Forensic Hub
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 opacity-20">
         <Separator className="bg-emerald-500/30" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto relative no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const button = (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full justify-start gap-4 h-11 px-4 text-sm font-semibold transition-all duration-300 rounded-xl border border-transparent shadow-none",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] translate-x-1"
                  : "text-muted-foreground hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-0 translate-x-0"
              )}
            >
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-colors duration-300",
                isActive ? "bg-emerald-500/20" : "bg-white/5"
              )}>
                <Icon className={cn("size-4 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="bg-emerald-950 border-emerald-500/30 text-emerald-400 font-bold">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      <div className="px-4 py-2 opacity-10">
         <Separator className="bg-white" />
      </div>

      {/* Collapse toggle */}
      <div className="p-4 shrink-0 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-full h-10 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
             <div className="flex items-center gap-2 px-2">
                <ChevronLeft className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Collapse View</span>
             </div>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
