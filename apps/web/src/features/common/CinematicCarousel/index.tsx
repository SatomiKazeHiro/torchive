import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Poster, Carousel } from "@/components";

export interface Slide {
  label: string;
  cover: string;
  description?: string;
  link?: string;
}

export interface CinematicLayoutCarouselProps {
  slides: Slide[];
  interval?: number;
  className?: string;
  /** 点击链接时的基础路径，默认为空 */
  basePath?: string;
}

/**
 * CinematicLayoutCarousel
 *
 * 设计意图：背景层 blur(20px) + scale(1.08) 是功能性的——scale 防止
 * blur 露出图像边缘，blur 把任意 cover 平滑过渡为统一的氛围底纹。
 * 顶重底轻的渐变（from-rich-black/45 to-transparent）保证标题区可
 * 读性，同时避免全屏均匀暗化带来的"灰幕"感，比单一 bg-rich-black/35
 * 更克制。
 */
export default function CinematicLayoutCarousel({
  slides,
  interval = 5000,
  className = "",
  basePath = "",
}: CinematicLayoutCarouselProps) {
  const navigate = useNavigate();
  // 状态
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] || slides[0];

  // 背景双层
  const [bgLayer, setBgLayer] = useState<0 | 1>(0);
  const bgImages = useRef<[string, string]>(["", ""]);

  useEffect(() => {
    if (!activeSlide?.cover) return;
    const next = bgLayer === 0 ? 1 : 0;
    bgImages.current[next] = activeSlide.cover;
    setBgLayer(next);
  }, [activeIndex]); // eslint-disable-line

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ minHeight: 520 }}>
      {/* ===== 背景 A ===== */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: `url('${bgImages.current[0]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px)",
          transform: "scale(1.08)",
          opacity: bgLayer === 0 ? 1 : 0,
        }}
      />

      {/* ===== 背景 B ===== */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: `url('${bgImages.current[1]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px)",
          transform: "scale(1.08)",
          opacity: bgLayer === 1 ? 1 : 0,
        }}
      />

      {/* 顶重底轻渐变：保证标题区可读，避免满屏暗化 */}
      <div className="absolute inset-0 bg-gradient-to-b from-rich-black/45 to-transparent" />

      {/* ================= 前景 ================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-18">
        <div className="flex flex-col gap-16 md:flex-row">
          {/* ===== 左：轮播 ===== */}
          <div className="w-full md:w-3xs">
            <Carousel
              items={slides}
              interval={interval}
              onChange={setActiveIndex}
              aspectRatio="aspect-video h-80"
              renderItem={(s) => <Poster src={s.cover} alt={s.label} ratio={undefined} />}
            />
          </div>

          {/* ===== 右：文字 ===== */}
          <div className="flex flex-auto flex-col justify-start">
            <h3 className="mb-3 text-2xl font-semibold text-white md:text-3xl">
              {activeSlide?.label}
            </h3>
            {activeSlide?.description && (
              <p className="mb-4 text-sm text-white/90 md:text-base">{activeSlide.description}</p>
            )}
            {activeSlide?.link && (
              <button
                onClick={() => navigate(basePath + activeSlide.link)}
                className="mt-2 w-fit cursor-pointer rounded-md bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
              >
                了解更多
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
