import React, { useEffect, useRef, useState } from "react";
import { BiImage } from "react-icons/bi";
import { cn } from "@/components/utils/common";

type PosterOrientation = "portrait" | "landscape";
const DEFAULT_FALLBACK_RATIO = 0.74;

export interface PosterV2Props {
  src?: string;
  alt?: string;
  /**
   * 可选比例，例如 "3/4"、"2/3"、"16/9"
   * 不传时默认占满父元素宽高
   */
  ratio?: string;
  /**
   * 当没有传 ratio 且容器高度塌缩时使用的兜底比例
   * 默认为 0.74（更接近常见海报封面）
   */
  fallbackRatio?: number | string;
  /**
   * 画幅内嵌模式：加载后，画幅图像将忽略比例设置，靠图片自身高度撑开
   */
  landscapeInset?: boolean;
  className?: string;
  imgClassName?: string;
}

function PosterV2({
  src,
  alt = "",
  ratio,
  fallbackRatio = DEFAULT_FALLBACK_RATIO,
  landscapeInset = false,
  className,
  imgClassName,
}: PosterV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [orientation, setOrientation] = useState<PosterOrientation>("portrait");
  const [useFallbackRatio, setUseFallbackRatio] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    setLoaded(false);
    setError(false);
    setOrientation("portrait");
    setUseFallbackRatio(false);
  }, [src]);

  useEffect(() => {
    if (ratio) {
      setUseFallbackRatio(false);
    }
  }, [ratio]);

  useEffect(() => {
    const node = containerRef.current;

    if (!src || !node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setShouldLoad(true);
        observerRef.current?.disconnect();
        observerRef.current = null;
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.01,
      },
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const node = containerRef.current;

    if (!node || ratio || useFallbackRatio || typeof ResizeObserver === "undefined") {
      return;
    }

    const checkCollapsedHeight = () => {
      const { width, height } = node.getBoundingClientRect();

      if (width > 0 && height <= 1) {
        setUseFallbackRatio(true);
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;
      }
    };

    checkCollapsedHeight();

    resizeObserverRef.current = new ResizeObserver(checkCollapsedHeight);
    resizeObserverRef.current.observe(node);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [ratio, useFallbackRatio]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setOrientation(image.naturalWidth < image.naturalHeight ? "portrait" : "landscape");
    setLoaded(true);
  };

  const showPlaceholder = !loaded;
  const canRenderImage = shouldLoad && !!src && !error;
  const isPortrait = loaded && orientation === "portrait";
  const isLandscape = loaded && orientation === "landscape";
  const resolvedRatio = ratio ?? (useFallbackRatio ? fallbackRatio : undefined);
  const shouldInsetLandscape = landscapeInset && isLandscape;
  const shouldUseRatio = shouldInsetLandscape ? undefined : resolvedRatio;
  const imgSizingClass = shouldUseRatio && isPortrait
    ? "block h-full w-full object-cover"
    : isLandscape
      ? cn("h-auto w-full", shouldInsetLandscape && "block")
      : "h-full w-auto max-w-full object-contain";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate",
        shouldUseRatio || shouldInsetLandscape ? "w-full" : "h-full w-full",
        showPlaceholder
          ? "bg-subtle"
          : "bg-transparent shadow-none",
        className,
      )}
      style={shouldUseRatio ? { aspectRatio: shouldUseRatio } : undefined}
    >
      <div
        className={cn(
          shouldInsetLandscape ? "relative" : "absolute inset-0",
          isLandscape
            ? "flex items-start justify-center"
            : "flex items-center justify-center",
        )}
      >
        {canRenderImage && (
          <div className={cn("w-full rounded-lg", isLandscape ? "h-auto" : "h-full")} style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}>
            <img
              src={src}
              alt={alt}
              decoding="async"
              draggable={false}
              onLoad={handleLoad}
              onError={() => setError(true)}
              className={cn(
                "select-none transition-opacity duration-300 rounded-lg overflow-hidden",
                loaded ? "opacity-100" : "opacity-0",
                imgSizingClass,
                imgClassName,
              )}
            />
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 rounded-lg",
          showPlaceholder ? "opacity-100" : "opacity-0",
        )}
        style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 12px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px" }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <BiImage className="h-10 w-10 text-faint" />
        </div>
      </div>
    </div>
  );
}

export default React.memo(PosterV2);
