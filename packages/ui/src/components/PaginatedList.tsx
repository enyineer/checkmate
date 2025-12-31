import * as React from "react";
import {
  usePagination,
  type UsePaginationOptions,
  type PaginationState,
} from "../hooks/usePagination";
import { Pagination } from "./Pagination";
import { cn } from "../utils";

export interface PaginatedListProps<TResponse, TItem, TExtraParams = object>
  extends UsePaginationOptions<TResponse, TItem, TExtraParams> {
  /**
   * Render function for the items
   */
  children: (
    items: TItem[],
    loading: boolean,
    pagination: PaginationState
  ) => React.ReactNode;

  /**
   * Show loading spinner
   * @default true
   */
  showLoadingSpinner?: boolean;

  /**
   * Content to show when no items
   */
  emptyContent?: React.ReactNode;

  /**
   * Show pagination controls
   * @default true
   */
  showPagination?: boolean;

  /**
   * Show page size selector
   * @default true
   */
  showPageSize?: boolean;

  /**
   * Show total items count
   * @default true
   */
  showTotal?: boolean;

  /**
   * Available page sizes
   */
  pageSizes?: number[];

  /**
   * Container class name
   */
  className?: string;

  /**
   * Pagination container class name
   */
  paginationClassName?: string;
}

/**
 * All-in-one paginated list component with automatic data fetching.
 *
 * @example
 * ```tsx
 * <PaginatedList
 *   fetchFn={(p) => client.getNotifications(p)}
 *   getItems={(r) => r.notifications}
 *   getTotal={(r) => r.total}
 *   extraParams={{ unreadOnly: true }}
 * >
 *   {(items, loading) =>
 *     loading ? null : items.map((item) => <Card key={item.id} {...item} />)
 *   }
 * </PaginatedList>
 * ```
 */
export function PaginatedList<TResponse, TItem, TExtraParams = object>({
  children,
  showLoadingSpinner = true,
  emptyContent,
  showPagination = true,
  showPageSize = true,
  showTotal = true,
  pageSizes,
  className,
  paginationClassName,
  ...paginationOptions
}: PaginatedListProps<TResponse, TItem, TExtraParams>) {
  const { items, loading, pagination } = usePagination(paginationOptions);

  const showEmpty = !loading && items.length === 0 && emptyContent;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Loading state */}
      {loading && showLoadingSpinner && (
        <div className="flex justify-center py-8 text-muted-foreground">
          Loading...
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="flex justify-center py-8 text-muted-foreground">
          {emptyContent}
        </div>
      )}

      {/* Content */}
      {!showEmpty && children(items, loading, pagination)}

      {/* Pagination controls */}
      {showPagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          limit={pagination.limit}
          onPageSizeChange={pagination.setLimit}
          total={showTotal ? pagination.total : undefined}
          showPageSize={showPageSize}
          showTotal={showTotal}
          pageSizes={pageSizes}
          className={paginationClassName}
        />
      )}
    </div>
  );
}
