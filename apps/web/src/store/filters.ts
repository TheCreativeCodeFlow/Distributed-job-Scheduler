import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalFilters {
  orgId: string | null;
  projectId: string | null;
  queueId: string | null;
  timeRange: '24h' | '7d' | '30d' | 'all';
}

interface FiltersState {
  filters: GlobalFilters;
  setFilters: (filters: Partial<GlobalFilters>) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      filters: {
        orgId: null,
        projectId: null,
        queueId: null,
        timeRange: '24h',
      },
      setFilters: (updated) =>
        set((state) => ({
          filters: { ...state.filters, ...updated },
        })),
      resetFilters: () =>
        set({
          filters: {
            orgId: null,
            shadowProjectId: null,
            projectId: null,
            queueId: null,
            timeRange: '24h',
          } as any,
        }),
    }),
    {
      name: 'scheduler-filters-store',
    },
  ),
);
