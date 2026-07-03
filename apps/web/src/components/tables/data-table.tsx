'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface Sorting {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (key: string, order: 'asc' | 'desc') => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  getRowId?: (row: T) => string;
  pagination?: Pagination;
  sorting?: Sorting;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  getRowId,
  pagination,
  sorting,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  emptyMessage = 'No data records found.',
}: DataTableProps<T>) {
  const toggleSelectAll = () => {
    if (!onSelectionChange || !getRowId) return;

    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      const allIds = data.map((row) => getRowId(row));
      onSelectionChange(allIds);
    }
  };

  const toggleSelectRow = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable || !sorting) return;

    const isCurrent = sorting.sortBy === col.key;
    const nextOrder = isCurrent && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    sorting.onSortChange(col.key, nextOrder);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="w-full space-y-4">
      {/* Bulk actions panel */}
      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">
            {selectedIds.length} rows selected
          </span>
          <div className="flex gap-2">{bulkActions(selectedIds)}</div>
        </div>
      )}

      {/* Table Frame */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {selectable && (
                  <th className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className={cn(
                      'px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs',
                      col.sortable &&
                        'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.className,
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sorting && (
                        <span className="text-muted-foreground/60">
                          {sorting.sortBy === col.key ? (
                            sorting.sortOrder === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: pagination?.limit || 5 }).map(
                  (_, rIdx) => (
                    <tr key={rIdx}>
                      {selectable && (
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-4" />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          <Skeleton className="h-4 w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ),
                )
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Inbox className="h-10 w-10 text-muted-foreground/60" />
                      <p className="text-sm text-muted-foreground">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => {
                  const id = getRowId ? getRowId(row) : String(rIdx);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={cn(
                        'hover:bg-muted/10 transition-colors',
                        isSelected && 'bg-primary/5 hover:bg-primary/10',
                      )}
                    >
                      {selectable && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(id)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-6 py-4 text-foreground font-medium',
                            col.className,
                          )}
                        >
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination component */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/20 pt-4">
          <span className="text-xs text-muted-foreground font-medium">
            Showing Page {pagination.page} of {pagination.totalPages} (
            {pagination.total} records total)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
