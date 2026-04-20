"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HealthBadgeProps {
  status: "healthy" | "unhealthy" | "degraded" | "unknown" | "error";
  label?: string;
  className?: string;
}

const statusConfig = {
  healthy: {
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  unhealthy: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
  degraded: {
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
  },
  unknown: {
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
  },
  error: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
};

export function HealthBadge({
  status,
  label,
  className,
}: HealthBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  const displayLabel =
    label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 h-5 rounded-md shadow-inner", config.className, className)}
    >
      <span
        className={cn(
          "inline-block size-1.5 rounded-full",
          config.dot,
          status === "healthy" ? "glow-emerald animate-pulse" : status === "error" || status === "unhealthy" ? "glow-red" : "opacity-50"
        )}
      />
      {displayLabel}
    </Badge>
  );
}
