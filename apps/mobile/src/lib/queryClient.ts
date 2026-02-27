import { QueryClient } from '@tanstack/react-query';

/**
 * Defaults tuned for tab navigation: cache-first, no full-page loaders on switch.
 * - staleTime: data treated fresh for 2 min; no refetch on tab focus
 * - gcTime: keep unused cache 30 min
 * - refetchOnWindowFocus: false so switching tabs doesn't trigger loaders
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      gcTime: 30 * 60 * 1000, // 30 min (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
