import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { BiImage } from "react-icons/bi";
import { PRELOAD_RANGE } from "../constants";
import { cn } from "@/components/utils/common";

interface LazyImageProps {
  src: string;
  alt: string;
  index: number;
  estimatedHeight: number;
  onHeightChange?: (height: number) => void;
  onVisible?: (index: number) => void;
  /** 加载优先级：0=当前页立即加载，1=预加载，2=普通懒加载 */
  priority?: number;
}

export interface LazyImageRef {
  scrollIntoView: (behavior?: ScrollBehavior) => void;
}

const LazyImage = forwardRef<LazyImageRef, LazyImageProps>(
  ({ src, alt, index, estimatedHeight, onHeightChange, onVisible, priority = 2 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [actualHeight, setActualHeight] = useState<number>(0);
    const [shouldLoad, setShouldLoad] = useState(priority === 0); // 优先级0立即加载

    // 暴露 scrollIntoView 方法
    useImperativeHandle(ref, () => ({
      scrollIntoView: (behavior: ScrollBehavior = "smooth") => {
        containerRef.current?.scrollIntoView({ behavior, block: "start" });
      },
    }));

    // 监听是否应该加载（根据优先级和可见性）
    useEffect(() => {
      // 优先级0：立即加载
      if (priority === 0) {
        setShouldLoad(true);
        return;
      }

      // 优先级1：预加载（当接近视口时加载）
      if (priority === 1) {
        const preloadObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              preloadObserver.disconnect();
            }
          },
          {
            rootMargin: `${PRELOAD_RANGE * estimatedHeight * 2}px 0px`, // 更大的预加载范围
            threshold: 0,
          },
        );

        if (containerRef.current) {
          preloadObserver.observe(containerRef.current);
        }

        return () => preloadObserver.disconnect();
      }

      // 优先级2：普通懒加载（进入视口时加载）
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            onVisible?.(index);
            observer.disconnect();
          }
        },
        {
          rootMargin: `${PRELOAD_RANGE * estimatedHeight}px 0px`,
          threshold: 0.1,
        },
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [estimatedHeight, index, onVisible, priority]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const height = img.naturalHeight;
      setIsLoaded(true);
      setActualHeight(height);
      onHeightChange?.(height);
    };

    // 使用实际高度或估算高度
    const displayHeight = isLoaded && actualHeight > 0 ? "auto" : `${estimatedHeight}px`;

    return (
      <div
        ref={containerRef}
        data-index={index}
        className="relative mb-2 flex w-full items-center justify-center overflow-hidden bg-zinc-900"
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <BiImage className="h-8 w-8 text-zinc-700" />
            <span className="mt-2 text-xs text-zinc-600">第 {index + 1} 页</span>
          </div>
        )}
        {shouldLoad && (
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full object-contain transition-opacity duration-300 select-none pointer-events-none",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            style={{ height: displayHeight }}
            onLoad={handleLoad}
            draggable={false}
            loading={priority <= 1 ? "eager" : "lazy"} // 优先级0和1使用eager加载
          />
        )}
      </div>
    );
  },
);

LazyImage.displayName = "LazyImage";

export default LazyImage;
