import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "../utils";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface HealthBadgeProps {
  status: HealthStatus;
  variant?: "compact" | "full";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "Healthy",
    className:
      "bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900",
    iconClassName: "text-green-600 dark:text-green-400",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    className:
      "bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900",
    iconClassName: "text-yellow-600 dark:text-yellow-400",
  },
  unhealthy: {
    icon: XCircle,
    label: "Unhealthy",
    className:
      "bg-destructive/10 text-destructive-foreground border-destructive/30",
    iconClassName: "text-destructive",
  },
} as const;

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  status,
  variant = "full",
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isCompact = variant === "compact";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3.5 w-3.5", config.iconClassName)} />}
      {!isCompact && <span>{config.label}</span>}
    </span>
  );
};
