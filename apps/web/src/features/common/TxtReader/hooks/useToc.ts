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

  // 生成目录
  useEffect(() => {
    if (paragraphs.length > 0 && tocItems.length === 0) {
      const toc = generateToc(paragraphs);
      setTocItems(toc);
    }
  }, [paragraphs, tocItems.length]);

  // 更新当前目录索引（基于滚动位置）
  const updateCurrentTocIndex = useCallback(() => {
    // 如果最近 1 秒内有点击目录操作，不更新（避免点击后滚动导致的闪烁）
    if (Date.now() - lastClickTimeRef.current < 1000) return;
    
    if (tocItems.length === 0) return;

    // 找到当前滚动位置对应的目录项
    let tocIndex = -1;
    for (let i = 0; i < tocItems.length; i++) {
      const item = tocItems[i];
      const nextItem = tocItems[i + 1];
      
      // 当前目录项的估计位置
      const itemPosition = item.paragraphIndex * itemHeight;
      // 下一个目录项的估计位置（如果是最后一个则使用无穷大）
      const nextItemPosition = nextItem 
        ? nextItem.paragraphIndex * itemHeight 
        : Infinity;
      
      // 如果滚动位置在这个范围内，说明当前浏览的是这个章节
      if (scrollTop >= itemPosition - itemHeight && scrollTop < nextItemPosition) {
        tocIndex = i;
        break;
      }
    }

    if (tocIndex !== -1 && tocIndex !== currentTocIndex) {
      setCurrentTocIndex(tocIndex);
    }
  }, [scrollTop, itemHeight, tocItems, currentTocIndex]);

  // 跳转到指定目录项
  const jumpToTocItem = useCallback(
    (item: TocItem, container: HTMLDivElement | null) => {
      if (container) {
        // 记录点击时间，避免立即被滚动更新覆盖
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
