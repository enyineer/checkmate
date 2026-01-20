import React from "react";
import { cn } from "@checkstack/ui";

interface SparklineTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Instant CSS-based tooltip for sparkline segments.
 * Shows on hover with no delay, positioned above the element.
 * Supports multi-line content via \n in string content.
 */
export const SparklineTooltip: React.FC<SparklineTooltipProps> = ({
  content,
  children,
  className,
}) => {
  // If content is a string with newlines, split into lines for proper rendering
  const renderedContent =
    typeof content === "string" && content.includes("\n") ? (
      <div className="flex flex-col items-center gap-0.5">
        {content.split("\n").map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    ) : (
      content
    );

  return (
    <div className={cn("group/tooltip relative flex-1 h-full", className)}>
      {children}
      <div
        className={cn(
          "pointer-events-none absolute z-50",
          "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
          "whitespace-nowrap px-2 py-1 text-xs text-center",
          "rounded bg-popover border border-border shadow-md",
          "opacity-0 group-hover/tooltip:opacity-100",
          "transition-opacity duration-75",
        )}
      >
        {renderedContent}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  );
};
