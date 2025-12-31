import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { cn } from "../utils";

export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items (optional, for display) */
  total?: number;
  /** Items per page (for page size selector) */
  limit?: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Callback when page size changes */
  onPageSizeChange?: (limit: number) => void;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show total items count */
  showTotal?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Pagination component for navigating through paginated data.
 * Works seamlessly with usePagination hook.
 *
 * @example
 * ```tsx
 * const { items, pagination } = usePagination({ ... });
 *
 * <Pagination
 *   page={pagination.page}
 *   totalPages={pagination.totalPages}
 *   onPageChange={pagination.setPage}
 *   limit={pagination.limit}
 *   onPageSizeChange={pagination.setLimit}
 *   total={pagination.total}
 *   showPageSize
 *   showTotal
 * />
 * ```
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  limit,
  pageSizes = [10, 25, 50, 100],
  onPageSizeChange,
  showPageSize = false,
  showTotal = false,
  className,
}: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 flex-wrap",
        className
      )}
    >
      {/* Left side: Page size selector and total */}
      <div className="flex items-center gap-4">
        {showPageSize && limit && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showTotal && total !== undefined && (
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, idx) =>
          pageNum === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "primary" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? "page" : undefined}
            >
              {pageNum}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
