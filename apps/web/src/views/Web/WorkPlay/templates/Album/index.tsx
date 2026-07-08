import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { BiHeart, BiSolidHeart, BiBookmark, BiSolidBookmark, BiFolder, BiImage, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import FavoriteAction from "@/features/user-library/FavoriteAction";
import WatchLaterAction from "@/features/user-library/WatchLaterAction";
import { Breadcrumb, Tooltip } from "@/components";
import { buildBreadcrumbItems } from "@/views/Web/utils/breadcrumb";
import { cn } from "@/components/utils/common";
import { sortFiles } from "@/utils/sort";
import { isImageFile } from "@/utils/fileHelper";
import type { AlbumPlayTemplateProps, ThumbnailItemProps } from "./types";
import { getFileName } from "@/utils/fileHelper";

// ============ 图片查看器组件 ============

interface ImageViewerProps {
  src: string;
  fileName: string;
}

function ImageViewer({ src, fileName }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 重置变换
  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 处理滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => {
        const newScale = Math.max(0.5, Math.min(5, prev * delta));
        if (newScale === 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    },
    []
  );

  // 处理鼠标按下（开始拖拽）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [scale, position]
  );

  // 处理鼠标移动（拖拽中）
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  // 处理鼠标松开（结束拖拽）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理双击（缩放切换）
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetTransform();
    } else {
      setScale(2);
    }
  }, [scale, resetTransform]);

  // 鼠标离开容器时结束拖拽
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden bg-zinc-950"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={fileName}
        draggable={false}
        className="max-h-full max-w-full object-contain shadow-xl select-none"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.12s ease-out",
          willChange: "transform",
        }}
      />

      {/* 缩放提示 */}
      {scale > 1 && (
        <div className="absolute top-4 left-4 rounded-full bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
          {Math.round(scale * 100)}% · 双击重置
        </div>
      )}
    </div>
  );
}

// ============ 缩略图项组件 ============

function ThumbnailItem({ src, alt, isActive, hasActive, onClick, index }: ThumbnailItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null);

  // 当激活时自动滚动到可视区域
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  // 焦点淡化：有选中项时，未选中项整体变淡；hover 时恢复
  const dimmed = hasActive && !isActive;

  const button = (
    <button
      ref={itemRef}
      onClick={onClick}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-sm transition-all duration-200",
        isActive
          ? "border-2 border-rich-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:border-zinc-100 dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          : "border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
        dimmed && "opacity-40 hover:opacity-100"
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-all duration-200",
          isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"
        )}
        loading="lazy"
      />
      {/* 序号标签 */}
      <span
        className={cn(
          "absolute bottom-1 right-1 rounded px-1 py-0.5 text-[10px] font-medium transition-colors",
          isActive
            ? "bg-rich-black text-white dark:bg-zinc-100 dark:text-rich-black"
            : "bg-black/50 text-white group-hover:bg-black/70"
        )}
      >
        {index + 1}
      </span>
    </button>
  );

  return <Tooltip content={alt} position="bottom">{button}</Tooltip>;
}

// ============ 主组件 ============

export default function AlbumPlayTemplate({
  transformedWorkData,
  domain,
  category,
  domainName,
  loading,
  error,
  onRetry,
  initialFilePath,
}: AlbumPlayTemplateProps) {
  // 提取所有图片文件
  const imageList = useMemo(() => {
    if (!transformedWorkData) return [];
    const { entities } = transformedWorkData;
    const images: string[] = [];

    // 添加 assets 中的图片
    if (entities.assets) {
      images.push(...entities.assets.filter(isImageFile));
    }

    // 添加 section 中的图片
    if (entities.section) {
      entities.section.forEach((sec) => {
        if (sec.files) {
          images.push(...sec.files.filter(isImageFile));
        }
      });
    }

    // 添加 orphanAssets 中的图片
    if (entities.orphanAssets) {
      images.push(...entities.orphanAssets.filter(isImageFile));
    }

    return sortFiles(images);
  }, [transformedWorkData]);

  // 当前图片索引
  const [currentIndex, setCurrentIndex] = useState(0);

  // 初始化时设置当前图片
  useEffect(() => {
    if (initialFilePath && imageList.length > 0) {
      const index = imageList.findIndex((path) => path === initialFilePath);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialFilePath, imageList]);

  // 当前图片
  const currentImage = imageList[currentIndex];
  const currentFileName = currentImage ? getFileName(currentImage) : "";

  // 作品信息
  const work = transformedWorkData?.work;
  const title = work?.detail?.title || work?.work || "相册";

  // 切换图片
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(imageList.length - 1, prev + 1));
  }, [imageList.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrev();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goToNext();
          break;
        case "Home":
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentIndex(imageList.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, imageList.length]);

  // 加载中状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-800 dark:border-t-zinc-400" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !work) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white py-12 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <BiImage className="mx-auto mb-4 h-12 w-12 text-zinc-200 dark:text-zinc-800" />
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{error || "作品不存在"}</p>
          <button
            onClick={onRetry}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 无图片状态
  if (imageList.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <BiFolder className="mx-auto mb-4 h-16 w-16 text-zinc-200 dark:text-zinc-800" />
          <p className="text-zinc-400">暂无图片</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 bg-white p-3 dark:bg-zinc-950">
      {/* 左侧：图片查看器 */}
      <div className="group relative flex flex-1 overflow-hidden rounded-lg border border-zinc-200 shadow-2xs dark:border-zinc-800">
        <ImageViewer src={currentImage} fileName={currentFileName} />

        {/* 左右切换按钮 - 默认隐藏，悬停时显示 */}
        <button
          onClick={goToPrev}
          disabled={currentIndex <= 0}
          className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-zinc-800/60 p-2 text-white opacity-0 transition-all hover:bg-zinc-800 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 group-hover:opacity-100 dark:bg-zinc-200/60 dark:text-zinc-900 dark:hover:bg-zinc-200"
          title="上一张 (←)"
        >
          <BiChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex >= imageList.length - 1}
          className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-zinc-800/60 p-2 text-white opacity-0 transition-all hover:bg-zinc-800 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 group-hover:opacity-100 dark:bg-zinc-200/60 dark:text-zinc-900 dark:hover:bg-zinc-200"
          title="下一张 (→)"
        >
          <BiChevronRight className="h-6 w-6" />
        </button>

        {/* 底部信息栏 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <p className="truncate text-sm font-medium">{currentFileName}</p>
            <p className="text-xs opacity-80">
              {currentIndex + 1} / {imageList.length}
            </p>
          </div>
        </div>
      </div>

      {/* 右侧：缩略图列表 */}
      <div className="flex h-full w-72 shrink-0 flex-col gap-3 xl:w-80">
        {/* 面包屑导航 */}
        <Breadcrumb
          items={buildBreadcrumbItems({ domain, category, domainName, showHome: true, overviewLabel: "总览" })}
          extra={
            work && (
              <>
                <FavoriteAction
                  work={work}
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                  activeSlot={<BiSolidHeart className="h-4 w-4 text-red-500" />}
                  inactiveSlot={<BiHeart className="h-4 w-4" />}
                />
                <WatchLaterAction
                  work={work}
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-deep-black dark:hover:bg-zinc-800"
                  activeSlot={<BiSolidBookmark className="h-4 w-4 text-deep-black" />}
                  inactiveSlot={<BiBookmark className="h-4 w-4" />}
                />
              </>
            )
          }
        />

        {/* 缩略图网格 */}
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          {/* 标题栏 */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">图片列表</h3>
            <span className="rounded-full border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800">
              {imageList.length}
            </span>
          </div>

          {/* 缩略图列表 */}
          <div
            className="flex-1 overflow-y-auto p-3 scrollbar-thin"
          >
            <div className="grid grid-cols-3 gap-2">
              {imageList.map((imagePath, index) => (
                <ThumbnailItem
                  key={`${imagePath}-${index}`}
                  src={imagePath}
                  alt={getFileName(imagePath)}
                  isActive={index === currentIndex}
                  hasActive={currentIndex >= 0}
                  onClick={() => goToImage(index)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* 底部信息：当前文件名（作品标题已在面包屑展示） */}
          <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <p
              className="truncate text-xs text-zinc-700 dark:text-zinc-300"
              title={currentFileName || title}
            >
              {currentFileName || title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
