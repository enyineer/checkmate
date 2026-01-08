import React from "react";
import { cn } from "../utils";

export interface TerminalEntry {
  id: string;
  timestamp: Date;
  content: string;
  variant?: "success" | "warning" | "error" | "info" | "default";
  suffix?: string;
}

interface TerminalFeedProps {
  entries: TerminalEntry[];
  maxEntries?: number;
  title?: string;
  className?: string;
}

const variantConfig = {
  success: {
    symbol: "✓",
    textClass: "text-emerald-400",
  },
  warning: {
    symbol: "⚠",
    textClass: "text-amber-400",
  },
  error: {
    symbol: "✗",
    textClass: "text-red-400",
  },
  info: {
    symbol: "●",
    textClass: "text-blue-400",
  },
  default: {
    symbol: "→",
    textClass: "text-gray-400",
  },
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * TerminalFeed - Generic CLI-style activity log
 * A generic terminal display component that receives entries from the caller.
 * The component is agnostic to domain-specific logic (health checks, notifications, etc.)
 */
export const TerminalFeed: React.FC<TerminalFeedProps> = ({
  entries,
  maxEntries = 8,
  title = "terminal",
  className,
}) => {
  const displayEntries = entries.slice(0, maxEntries);

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden border border-border/50",
        "bg-[#0d1117] shadow-xl",
        className
      )}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-border/30">
        {/* Window controls */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        {/* Title */}
        <span className="ml-2 text-xs text-gray-400 font-mono">$ {title}</span>
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-sm space-y-1 min-h-[200px]">
        {displayEntries.length === 0 ? (
          <div className="text-gray-500 animate-pulse">
            Waiting for events...
          </div>
        ) : (
          displayEntries.map((entry) => {
            const config = variantConfig[entry.variant ?? "default"];
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-start gap-x-2 group"
              >
                {/* Timestamp */}
                <span className="text-gray-500 flex-shrink-0">
                  [{formatTime(entry.timestamp)}]
                </span>
                {/* Status symbol */}
                <span className={cn("flex-shrink-0", config.textClass)}>
                  {config.symbol}
                </span>
                {/* Content - allows wrapping */}
                <span className="text-gray-300 break-words">
                  {entry.content}
                </span>
                {/* Optional suffix (e.g., response time) */}
                {entry.suffix && (
                  <span className="text-gray-500 text-xs flex-shrink-0 ml-auto">
                    {entry.suffix}
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-emerald-400">$</span>
          <span className="w-2 h-4 bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
