import { useCallback, useRef, useState } from "react";
import { useInterval } from "ahooks";

export interface UseSeamlessCarouselOptions {
  length: number;
  interval?: number;
}

export interface SeamlessCarouselApi {
  current: number; // extended index（从 1 开始）
  isAnimating: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  onTransitionEnd: () => void;
  pause: () => void;
  resume: () => void;
}

export function useSeamlessCarousel(options: UseSeamlessCarouselOptions): SeamlessCarouselApi {
  const { length, interval } = options;

  /* ================= 状态 ================= */

  const [current, setCurrent] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  /* ================= refs ================= */

  const pausedRef = useRef(false);

  /* ================= 使用 ahooks useInterval 替代手动 setInterval ================= */

  useInterval(
    () => {
      if (!pausedRef.current && length > 1) {
        setCurrent((prev) => prev + 1);
        setIsAnimating(true);
      }
    },
    interval && length > 1 ? interval : undefined
  );

  /* ================= 切换入口 ================= */

  const slideTo = useCallback(
    (next: number) => {
      if (isAnimating || length <= 1) return;
      setIsAnimating(true);
      setCurrent(next);
    },
    [isAnimating, length],
  );

  const goNext = useCallback(() => slideTo(current + 1), [slideTo, current]);

  const goPrev = useCallback(() => slideTo(current - 1), [slideTo, current]);

  const goTo = useCallback((index: number) => slideTo(index + 1), [slideTo]);

  /* ================= 无缝瞬移 ================= */

  const onTransitionEnd = useCallback(() => {
    setIsAnimating(false);

    setCurrent((prev) => {
      if (prev === 0) return length;
      if (prev === length + 1) return 1;
      return prev;
    });
  }, [length]);

  /* ================= API ================= */

  return {
    current,
    isAnimating,
    goNext,
    goPrev,
    goTo,
    onTransitionEnd,
    pause: () => {
      pausedRef.current = true;
    },
    resume: () => {
      pausedRef.current = false;
    },
  };
}
