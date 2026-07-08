import React, { useEffect, useMemo } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useSeamlessCarousel } from "./useSeamlessCarousel";

export interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  interval?: number;
  className?: string;
  onChange?: (index: number) => void;
  showArrows?: boolean;
  showDots?: boolean;
  aspectRatio?: string;
  gap?: number;
}

export default function Carousel<T>({
  items,
  renderItem,
  interval = 5000,
  className = "",
  onChange,
  showArrows = true,
  showDots = true,
  aspectRatio = "aspect-video",
  gap = 20,
}: CarouselProps<T>) {
  const { current, isAnimating, goNext, goPrev, goTo, onTransitionEnd, pause, resume } =
    useSeamlessCarousel({
      length: items.length,
      interval,
    });

  const extendedItems = useMemo(
    () => (items.length > 1 ? [items[items.length - 1], ...items, items[0]] : items),
    [items]
  );

  const realIndex =
    current === 0 ? items.length - 1 : current === items.length + 1 ? 0 : current - 1;

  useEffect(() => {
    onChange?.(realIndex);
  }, [realIndex, onChange]);

  return (
    /* 1. 最外层容器：不能有 overflow-hidden */
    <div className={`relative flex w-full flex-col items-center ${className}`}>
      
      {/* 2. 轮播包装层：定位基准 */}
      <div className={`relative w-full ${aspectRatio}`}>
        
        {/* 3. 左右按钮：使用负值定位到容器外 */}
        {items.length > 1 && showArrows && (
          <>
            <button
              onClick={goPrev}
              disabled={isAnimating}
              /* -left-4 结合 -translate-x-full 将按钮推到容器左外侧 */
              className="absolute -left-4 top-1/2 z-20 -translate-x-full -translate-y-1/2 cursor-pointer rounded-full bg-white/5 p-2 text-white transition-all hover:bg-white/15 active:scale-95 disabled:opacity-0"
              aria-label="Previous slide"
            >
              <BiChevronLeft size={16} />
            </button>
            
            <button
              onClick={goNext}
              disabled={isAnimating}
              /* -right-4 结合 translate-x-full 将按钮推到容器右外侧 */
              className="absolute -right-4 top-1/2 z-20 translate-x-full -translate-y-1/2 cursor-pointer rounded-full bg-white/5 p-2 text-white transition-all hover:bg-white/15 active:scale-95 disabled:opacity-0"
              aria-label="Next slide"
            >
              <BiChevronRight size={16} />
            </button>
          </>
        )}

        {/* 4. 真正负责裁剪的视口层 */}
        <div className="h-full w-full overflow-hidden">
          <div
            className={`flex h-full ${isAnimating ? "pointer-events-none" : ""}`}
            onMouseEnter={pause}
            onMouseLeave={resume}
            style={{
              width: `${extendedItems.length * 100}%`,
              transform: `translateX(-${current * (100 / extendedItems.length)}%)`,
              transition: isAnimating ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {extendedItems.map((item, i) => (
              <div
                key={i}
                className="h-full shrink-0"
                style={{
                  width: `${100 / extendedItems.length}%`,
                  paddingLeft: `${gap / 2}px`,
                  paddingRight: `${gap / 2}px`,
                }}
              >
                {renderItem(item, i)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 圆点导航 */}
      {items.length > 1 && showDots && (
        <div className="mt-6 flex gap-2.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === realIndex ? "w-8 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}