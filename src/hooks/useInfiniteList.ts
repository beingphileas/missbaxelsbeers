import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Simple infinite-scroll / load-more helper.
 * - Resets visible count when any dependency in `resetKey` changes.
 * - Returns a `sentinelRef` to attach to a div near the bottom of the list;
 *   when it intersects the viewport, more items become visible.
 * - Returns `loadMore` for an explicit "Toon meer" button.
 */
export function useInfiniteList<T>(items: T[], pageSize = 24, resetKey: unknown[] = []) {
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when filters/search/tab change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisible(pageSize); }, [pageSize, ...resetKey]);

  const hasMore = visible < items.length;

  const loadMore = useCallback(() => {
    setVisible((v) => Math.min(v + pageSize, items.length));
  }, [items.length, pageSize]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  return {
    visibleItems: items.slice(0, visible),
    visibleCount: Math.min(visible, items.length),
    totalCount: items.length,
    hasMore,
    loadMore,
    sentinelRef,
  };
}
