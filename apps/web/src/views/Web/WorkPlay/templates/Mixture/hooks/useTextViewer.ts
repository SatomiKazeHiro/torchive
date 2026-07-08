import { useState, useRef, useCallback, useEffect } from "react";
import { useUnmount } from "ahooks";

interface Paragraph {
  id: number;
  content: string;
}

interface UseTextViewerOptions {
  /** 文本文件 URL */
  src: string;
}

interface UseTextViewerReturn {
  /** 段落列表 */
  paragraphs: Paragraph[];
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否流式加载中 */
  isStreaming: boolean;
  /** 是否有错误 */
  hasError: boolean;
  /** 容器元素引用 */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 处理滚动事件 */
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** 虚拟列表配置 */
  virtualList: {
    totalHeight: number;
    startIndex: number;
    endIndex: number;
    offsetY: number;
    visibleParagraphs: Paragraph[];
  };
}

// 虚拟列表配置
const ITEM_HEIGHT = 28; // 每行高度
const OVERSCAN = 5; // 上下额外渲染行数

/**
 * 流式读取文本，按段落回调
 */
async function streamReadText(
  url: string,
  onParagraphs: (paragraphs: string[]) => void,
  onComplete: () => void,
) {
  try {
    const res = await fetch(url);
    if (!res.body) throw new Error("No body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 按换行拆分段落
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ""; // 保留未完成行

      const newParagraphs = lines.map((line) => line.trim()).filter((line) => line.length > 0);

      if (newParagraphs.length > 0) {
        onParagraphs(newParagraphs);
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      onParagraphs([buffer.trim()]);
    }

    onComplete();
  } catch (error) {
    console.error("Failed to stream read text:", error);
    throw error;
  }
}

/**
 * 文本查看器 Hook
 *
 * 功能：
 * - 流式加载大文本文件
 * - 虚拟滚动渲染（只渲染可视区域内容）
 * - 响应式容器高度
 *
 * 使用 ahooks：
 * - useUnmount: 清理 ResizeObserver
 */
export function useTextViewer({ src }: UseTextViewerOptions): UseTextViewerReturn {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 流式加载文本
  useEffect(() => {
    setIsLoading(true);
    setIsStreaming(true);
    setParagraphs([]);
    setScrollTop(0);
    setHasError(false);

    streamReadText(
      src,
      (newTexts) => {
        setParagraphs((prev) => {
          const startId = prev.length;
          const newParagraphs = newTexts.map((text, idx) => ({
            id: startId + idx,
            content: text,
          }));
          return [...prev, ...newParagraphs];
        });
      },
      () => {
        setIsLoading(false);
        setIsStreaming(false);
      },
    ).catch(() => {
      setHasError(true);
      setIsLoading(false);
      setIsStreaming(false);
    });
  }, [src]);

  // 监听容器大小变化
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
      }
    };
  }, []);

  // 使用 ahooks useUnmount 确保组件卸载时清理 ResizeObserver
  useUnmount(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  });

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 计算虚拟列表渲染范围
  const totalHeight = paragraphs.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(paragraphs.length, startIndex + visibleCount);
  const visibleParagraphs = paragraphs.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  return {
    paragraphs,
    isLoading,
    isStreaming,
    hasError,
    containerRef,
    handleScroll,
    virtualList: {
      totalHeight,
      startIndex,
      endIndex,
      offsetY,
      visibleParagraphs,
    },
  };
}
