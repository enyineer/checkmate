import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, Input } from "@checkmate-monitor/ui";
import { useApi } from "@checkmate-monitor/frontend-api";
import { catalogApiRef } from "@checkmate-monitor/catalog-frontend";
import { catalogRoutes, type System } from "@checkmate-monitor/catalog-common";
import { resolveRoute } from "@checkmate-monitor/common";
import {
  Activity,
  Search,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const catalogApi = useApi(catalogApiRef);

  const [query, setQuery] = useState("");
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch systems when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      catalogApi
        .getSystems()
        .then(setSystems)
        .catch(console.error)
        .finally(() => setLoading(false));

      // Focus input after dialog opens
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Reset state when dialog closes
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open, catalogApi]);

  // Filter systems based on query
  const filteredSystems = systems.filter((system) =>
    system.name.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (system: System) => {
      onOpenChange(false);
      navigate(
        resolveRoute(catalogRoutes.routes.systemDetail, { systemId: system.id })
      );
    },
    [navigate, onOpenChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredSystems.length - 1)
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (filteredSystems[selectedIndex]) {
            handleSelect(filteredSystems[selectedIndex]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          onOpenChange(false);
          break;
        }
      }
    },
    [filteredSystems, selectedIndex, handleSelect, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search systems..."
            className="border-0 bg-transparent focus-visible:ring-0 px-0 text-base"
          />
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {loading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Loading systems...
            </div>
          ) : filteredSystems.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {query ? "No systems found" : "Start typing to search..."}
            </div>
          ) : (
            filteredSystems.map((system, index) => (
              <button
                key={system.id}
                onClick={() => handleSelect(system)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Activity className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{system.name}</span>
                {index === selectedIndex && (
                  <CornerDownLeft className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-muted border border-border font-mono">
              esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
