import React, { useMemo, useEffect, useState } from "react";
import { cn } from "../utils";

interface AmbientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const TILE_SIZE = 48;

/**
 * AmbientBackground - Animated checkerboard pattern
 * Features a chess-inspired grid where random tiles glow with the primary color.
 * Dynamically adapts to screen size.
 */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  children,
  className,
}) => {
  const [dimensions, setDimensions] = useState({ cols: 40, rows: 25 });

  // Calculate grid size based on viewport
  useEffect(() => {
    const updateDimensions = () => {
      const cols = Math.ceil(globalThis.innerWidth / TILE_SIZE) + 2;
      const rows = Math.ceil(globalThis.innerHeight / TILE_SIZE) + 2;
      setDimensions({ cols, rows });
    };

    updateDimensions();
    globalThis.addEventListener("resize", updateDimensions);
    return () => globalThis.removeEventListener("resize", updateDimensions);
  }, []);

  // Generate tile grid with staggered animation delays
  const tiles = useMemo(() => {
    const { cols, rows } = dimensions;
    const result: Array<{ key: string; delay: number; isLight: boolean }> = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isLight = (row + col) % 2 === 0;
        // Negative delay so tiles start at different points in their 12s cycle
        // This creates a gentle, staggered breathing effect across the grid
        const delay = -((row * 7 + col * 13 + row * col) % 24) * 0.5;
        result.push({
          key: `${row}-${col}`,
          delay,
          isLight,
        });
      }
    }
    return result;
  }, [dimensions]);

  return (
    <div
      className={cn(
        "relative min-h-screen bg-background overflow-hidden",
        className
      )}
    >
      {/* Checkerboard grid - covers full viewport */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${dimensions.cols}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${dimensions.rows}, ${TILE_SIZE}px)`,
        }}
      >
        {tiles.map(({ key, delay, isLight }) => (
          <div
            key={key}
            className="tile-glow"
            style={
              {
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: isLight
                  ? "hsl(var(--muted-foreground) / 0.12)"
                  : "hsl(var(--muted-foreground) / 0.04)",
                "--glow-delay": `${delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Edge vignette to fade out the grid smoothly */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `
            linear-gradient(to right, hsl(var(--background)) 0%, transparent 5%, transparent 95%, hsl(var(--background)) 100%),
            linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 8%, transparent 92%, hsl(var(--background)) 100%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
