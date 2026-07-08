import React, { useRef, useState } from "react";
import TvLineIcon from "@/assets/svg-icons/tv-line.svg?react";

interface Props {
  src: string;
  alt?: string;
  /** * 比例属性，默认 3/4 (竖版海报)。
   * 可以传 "2/3", "16/9", "1/1" 等
   */
  ratio?: string;
}

function Poster({ src, alt, ratio = "3/4" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [useCover, setUseCover] = useState(false);
  const [error, setError] = useState(false);

  // 加载逻辑
  const handleLoad = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    // 获取图片原始比例 (宽/高)
    const imageRatio = img.naturalWidth / img.naturalHeight;
    // 获取容器实际比例 (宽/高)
    const { width, height } = container.getBoundingClientRect();
    const containerRatio = width / height;

    // 核心逻辑：
    // 如果 图片比容器更“瘦长”（imageRatio < containerRatio），
    // 则使用 cover 填满宽度并裁剪上下。
    // 否则使用 contain 保证高度适配并留边。
    if (imageRatio < containerRatio) {
      setUseCover(true);
    } else {
      setUseCover(false);
    }

    setLoaded(true);
  };

  if (!src || error) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 shadow text-gray-400"
        style={{ ...(ratio ? { aspectRatio: ratio } : { height: "100%" }) }}
      >
        <TvLineIcon className="h-12 w-12 opacity-25" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg bg-gray-100 shadow ${ratio ? "" : "h-full"}`}
      style={{ ...(ratio ? { aspectRatio: ratio } : {}) }}
    >
      {!loaded && <div className="absolute inset-0 z-10 animate-pulse bg-gray-300" />}

      <img
        ref={imgRef}
        src={src}
        onLoad={handleLoad}
        onError={() => setError(true)}
        alt={alt}
        draggable={false}
        className={`h-full w-full transition-all duration-500 ${useCover ? "object-cover" : "object-contain"} ${loaded ? "blur-0 opacity-100" : "opacity-0 blur-md"} `}
      />
    </div>
  );
}

export default React.memo(Poster);
