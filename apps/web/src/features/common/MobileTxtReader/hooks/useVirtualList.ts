/**
 * 虚拟列表 Hook
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { VIRTUAL_LIST_CONFIG } from "../constants";
import { calculateVirtualList } from "../utils";

interface UseVirtualListOptions {
  itemHeight: number;
  totalItems: number;
  overscan?: number;
}

interface UseVirtualListReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerHeight: number;
  scrollTop: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  virtualList: {
    totalHeight: number;
    startIndex: number;
    endIndex: number;
    offsetY: number;
  };
}

export function useVirtualList(options: UseVirtualListOptions): UseVirtualListReturn {
  const { itemHeight, totalItems, overscan = VIRTUAL_LIST_CONFIG.OVERSCAN } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    resizeObserverRef.current = new ResizeObserver(updateHeight);
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const virtualList = useMemo(() => {
    const result = calculateVirtualList({
      scrollTop,
      containerHeight,
      itemHeight,
      totalItems,
      overscan,
    });

    return {
      totalHeight: result.totalHeight,
      startIndex: result.startIndex,
      endIndex: result.endIndex,
      offsetY: result.offsetY,
    };
  }, [scrollTop, containerHeight, itemHeight, totalItems, overscan]);

  return {
    containerRef,
    containerHeight,
    scrollTop,
    handleScroll,
    virtualList,
  };
}
