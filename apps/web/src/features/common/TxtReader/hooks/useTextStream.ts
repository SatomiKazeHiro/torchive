/**
 * 文本流式加载 Hook
 */
import { useState, useEffect, useRef } from "react";
import { streamReadText } from "../utils";
import type { Paragraph } from "../types";

interface UseTextStreamOptions {
  src: string;
}

interface UseTextStreamReturn {
  paragraphs: Paragraph[];
  isLoading: boolean;
  isStreaming: boolean;
  hasError: boolean;
  paragraphsRef: React.RefObject<Paragraph[]>;
  reset: () => void;
}

export function useTextStream(options: UseTextStreamOptions): UseTextStreamReturn {
  const { src } = options;

  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const paragraphsRef = useRef<Paragraph[]>([]);

  const reset = () => {
    setIsLoading(true);
    setIsStreaming(true);
    setParagraphs([]);
    paragraphsRef.current = [];
    setHasError(false);
  };

  useEffect(() => {
    reset();

    streamReadText(src, {
      onParagraphs: (newTexts) => {
        setParagraphs((prev) => {
          const startId = prev.length;
          const newParagraphs = newTexts.map((text, idx) => ({
            id: startId + idx,
            content: text,
          }));
          const updated = [...prev, ...newParagraphs];
          paragraphsRef.current = updated;
          return updated;
        });
      },
      onComplete: () => {
        setIsLoading(false);
        setIsStreaming(false);
      },
      onError: () => {
        setHasError(true);
        setIsLoading(false);
        setIsStreaming(false);
      },
    });
  }, [src]);

  return {
    paragraphs,
    isLoading,
    isStreaming,
    hasError,
    paragraphsRef,
    reset,
  };
}
