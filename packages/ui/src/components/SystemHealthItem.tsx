import React from "react";
import { HealthBadge, HealthStatus } from "./HealthBadge";
import { cn } from "../utils";
import { Activity } from "lucide-react";

interface SystemHealthItemProps {
  name: string;
  status: HealthStatus;
  metadata?: {
    lastCheck?: string;
    latency?: number;
  };
  className?: string;
  onClick?: () => void;
}

export const SystemHealthItem: React.FC<SystemHealthItemProps> = ({
  name,
  status,
  metadata,
  className,
  onClick,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-all",
        isClickable && "cursor-pointer hover:border-border/80 hover:shadow-sm",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {metadata && (
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {metadata.latency !== undefined && (
                <span>{metadata.latency}ms</span>
              )}
              {metadata.lastCheck && (
                <span className="truncate">
                  Last check: {metadata.lastCheck}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <HealthBadge status={status} className="flex-shrink-0" />
    </div>
  );
};
