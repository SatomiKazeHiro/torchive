import { BiMusic } from "react-icons/bi";
import type { CoverSize } from "../types";

interface CoverProps {
  isPlaying: boolean;
  size?: CoverSize;
  type?: "vinyl" | "square";
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-24 w-24",
  lg: "h-40 w-40",
};

/**
 * 黑胶唱片封面组件 - 支持中间显示封面图片
 * 播放时会旋转，带有黑胶纹理效果
 */
interface VinylCoverProps extends CoverProps {
  /** 封面图片 URL */
  imageUrl?: string | null;
}

export function VinylCover({ isPlaying, size = "md", imageUrl }: VinylCoverProps) {
  // 内圈封面更大一些（原来是 30%，现在 42% 左右）
  const innerSizes = {
    sm: "inset-[22%]",
    md: "inset-[20%]",
    lg: "inset-[18%]",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={`group relative ${sizeClasses[size]} transition-transform duration-500 ${isPlaying ? "scale-[1.02]" : "scale-100"}`}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-full bg-zinc-900 ${isPlaying ? "animate-[spin_10s_linear_infinite]" : ""}`}
      >
        {/* 同心圆纹理 */}
        <div className="absolute inset-[3%] rounded-full border border-zinc-700/30" />
        <div className="absolute inset-[6%] rounded-full border border-zinc-700/25" />
        <div className="absolute inset-[9%] rounded-full border border-zinc-700/20" />
        <div className="absolute inset-[12%] rounded-full border border-zinc-700/15" />

        {/* 中心标签 - 显示封面图片或默认图标（更大） */}
        <div
          className={`absolute ${innerSizes[size]} overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/40`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Cover"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800">
              <BiMusic className={`${iconSizes[size]} text-zinc-500`} strokeWidth={0.5} />
            </div>
          )}
        </div>

        {/* 中心点 */}
        <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700" />
      </div>
    </div>
  );
}

/**
 * 方形默认封面组件
 * 无图片时显示音乐图标
 */
export function SquareCover({ isPlaying, size = "md" }: CoverProps) {
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 transition-all duration-500 dark:border-zinc-800 dark:bg-zinc-900 ${isPlaying ? "scale-[1.02]" : "scale-100"}`}
    >
      <BiMusic
        className={`${iconSizes[size]} text-zinc-300 dark:text-zinc-700`}
        strokeWidth={0.5}
      />
    </div>
  );
}

/**
 * 实际图片封面组件
 */
interface ImageCoverProps {
  /** 图片 URL */
  src: string;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 尺寸 */
  size?: CoverSize;
  /** 形状 */
  shape?: "circle" | "square";
}

export function ImageCover({ src, isPlaying, size = "md", shape = "square" }: ImageCoverProps) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";
  return (
    <div
      className={`relative ${sizeClasses[size]} overflow-hidden ${shapeClass} transition-transform duration-500 ${isPlaying ? "scale-[1.02]" : "scale-100"}`}
    >
      <img src={src} alt="Cover" className="h-full w-full object-cover" />
    </div>
  );
}

/**
 * 可切换的封面组件 - 标准模式用
 * 支持在黑胶唱片和方形封面之间切换
 */
interface SwitchableCoverProps extends CoverProps {
  /** 是否显示黑胶唱片 */
  showVinyl: boolean;
  /** 切换回调 */
  onToggle: () => void;
  /** 自定义类名 */
  className?: string;
  /** 封面图片 URL */
  imageUrl?: string | null;
}

export function SwitchableCover({
  isPlaying,
  size = "md",
  showVinyl,
  onToggle,
  className = "",
  imageUrl,
}: SwitchableCoverProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative shrink-0 cursor-pointer ${sizeClasses[size]} ${className}`}
      title={showVinyl ? "切换为封面" : "切换为唱片"}
    >
      {/* 唱片状态 - 黑胶纹理 + 中间封面图片 */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          showVinyl ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <VinylCover isPlaying={isPlaying} size={size} imageUrl={imageUrl} />
      </div>

      {/* 封面状态 - 方形图片或默认 */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          showVinyl ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {imageUrl ? (
          <ImageCover src={imageUrl} isPlaying={isPlaying} size={size} shape="square" />
        ) : (
          <SquareCover isPlaying={isPlaying} size={size} />
        )}
      </div>
    </button>
  );
}

/**
 * 横板模式用的简单封面组件 - 方形图片（无黑胶纹理）
 */
interface SimpleCoverProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 尺寸 */
  size?: CoverSize;
  /** 封面图片 URL */
  imageUrl?: string | null;
  /** 点击回调 */
  onClick?: () => void;
}

export function SimpleCover({ isPlaying, size = "sm", imageUrl, onClick }: SimpleCoverProps) {
  const sizeClasses = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const content = imageUrl ? (
    <img
      src={imageUrl}
      alt="Cover"
      className="h-full w-full rounded-lg object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700">
      <BiMusic className="h-4 w-4 text-zinc-500" strokeWidth={0.5} />
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`relative shrink-0 cursor-pointer ${sizeClasses[size]} transition-transform duration-500 ${isPlaying ? "scale-[1.02]" : "scale-100"}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${sizeClasses[size]} transition-transform duration-500 ${isPlaying ? "scale-[1.02]" : "scale-100"}`}
    >
      {content}
    </div>
  );
}
