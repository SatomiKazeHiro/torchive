/**
 * 目录管理 Hook
 */
import { useState, useEffect, useCallback, useRef } from "react";
import type { TocItem, Paragraph } from "../types";
import { generateToc } from "../utils";

interface UseTocOptions {
  paragraphs: Paragraph[];
  scrollTop: number;
  itemHeight: number;
}

interface UseTocReturn {
  tocItems: TocItem[];
  currentTocIndex: number;
  updateCurrentTocIndex: () => void;
  jumpToTocItem: (item: TocItem, container: HTMLDivElement | null) => void;
  setCurrentTocIndex: (index: number) => void;
}

export function useToc(options: UseTocOptions): UseTocReturn {
  const { paragraphs, scrollTop, itemHeight } = options;

  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [currentTocIndex, setCurrentTocIndex] = useState(-1);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    if (paragraphs.length > 0 && tocItems.length === 0) {
      const toc = generateToc(paragraphs);
      setTocItems(toc);
    }
  }, [paragraphs, tocItems.length]);

  const updateCurrentTocIndex = useCallback(() => {
    if (Date.now() - lastClickTimeRef.current < 1000) return;
    if (tocItems.length === 0) return;

    let tocIndex = -1;
    for (let i = 0; i < tocItems.length; i++) {
      const item = tocItems[i];
      const nextItem = tocItems[i + 1];
      
      const itemPosition = item.paragraphIndex * itemHeight;
      const nextItemPosition = nextItem 
        ? nextItem.paragraphIndex * itemHeight 
        : Infinity;
      
      if (scrollTop >= itemPosition - itemHeight && scrollTop < nextItemPosition) {
        tocIndex = i;
        break;
      }
    }

    if (tocIndex !== -1 && tocIndex !== currentTocIndex) {
      setCurrentTocIndex(tocIndex);
    }
  }, [scrollTop, itemHeight, tocItems, currentTocIndex]);

  const jumpToTocItem = useCallback(
    (item: TocItem, container: HTMLDivElement | null) => {
      if (container) {
        lastClickTimeRef.current = Date.now();
        container.scrollTop = item.paragraphIndex * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    tocItems,
    currentTocIndex,
    updateCurrentTocIndex,
    jumpToTocItem,
    setCurrentTocIndex,
  };
}
