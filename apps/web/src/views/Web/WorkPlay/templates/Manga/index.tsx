import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetState, useLocalStorageState } from "ahooks";
import { BiImages, BiImage } from "react-icons/bi";

import { cn } from "@/components/utils/common";
import toPrevCursor from "@/assets/svg-icons/to-prev_x32.svg";
import toNextCursor from "@/assets/svg-icons/to-next_x32.svg";
import { LazyImage, SettingsPanel, Toolbar } from "./components";
import { generateChapterUnits } from "./utils";
import { useMangaPlayState } from "./useMangaPlayState";
import { DEFAULT_ESTIMATED_HEIGHT, SAMPLE_SIZE, TOOLBAR_HIDE_DELAY } from "./constants";

import type { LazyImageRef } from "./components/LazyImage";
import type { MangaPlayTemplateProps, ReadingMode, ChapterUnit } from "./types";

// ============ 主组件 ============
export default function MangaPlayTemplate({
  transformedWorkData,
  domain,
  category,
  loading,
  error,
  initialFilePath,
}: MangaPlayTemplateProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const stripContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 从 localStorage 读取设置
  const [settings, setSettings] = useLocalStorageState<{
    mode: ReadingMode;
    autoPlayInterval: number;
  }>("manga-reader-settings", {
    defaultValue: {
      mode: "single",
      autoPlayInterval: 3,
    },
  });

  // 局部 UI 状态(非 URL 状态)
  const [state, setState] = useSetState({
    isHover: false,
    isSettingOpen: false,
    isAutoPlay: false,
    mode: (settings?.mode ?? "single") as ReadingMode,
    autoPlayInterval: settings?.autoPlayInterval ?? 3,
  });

  // 图片高度记录（用于动态估算）
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});

  // 条漫模式下当前可见的图片索引（不入 URL）
  const [visibleImageIndex, setVisibleImageIndex] = useState(0);
  const imageRefs = useRef<(LazyImageRef | null)[]>([]);
  const lastModeRef = useRef<ReadingMode>(state.mode);

  // ============ 章节列表(纯数据) ============
  const { work, chapterUnits } = useMemo(() => {
    if (!transformedWorkData) {
      return { work: null, chapterUnits: [] as ChapterUnit[] };
    }
    return {
      work: transformedWorkData.work,
      chapterUnits: generateChapterUnits(transformedWorkData.entities),
    };
  }, [transformedWorkData]);

  // ============ URL 状态(章节 + 页码由 ?chapter=&page= 驱动) ============
  const { currentChapterIndex, currentPage, setPage, setChapterIndex } = useMangaPlayState(
    chapterUnits,
    initialFilePath,
  );

  const currentChapter = chapterUnits[currentChapterIndex] ?? null;
  const totalPages = currentChapter?.files.length || 0;
  const isFirstChapter = currentChapterIndex <= 0;
  const isLastChapter = currentChapterIndex >= chapterUnits.length - 1;

  // 章节切换时清空历史图片高度,重新估算
  useEffect(() => {
    setImageHeights({});
  }, [currentChapterIndex]);

  // 镜像 URL 状态供 autoPlay 定时器闭包读取最新值
  const urlStateRef = useRef({ currentPage, currentChapterIndex, totalPages, isLastChapter });
  useEffect(() => {
    urlStateRef.current = { currentPage, currentChapterIndex, totalPages, isLastChapter };
  }, [currentPage, currentChapterIndex, totalPages, isLastChapter]);

  // 当前图片 URL
  const currentImageUrl = useMemo(() => {
    if (!currentChapter || currentPage < 1 || currentPage > currentChapter.files.length) {
      return null;
    }
    return currentChapter.files[currentPage - 1];
  }, [currentChapter, currentPage]);

  // 预加载图片（当前页的前后各2页）
  useEffect(() => {
    if (!currentChapter || state.mode !== "single") return;

    const preloadRange = 2;
    const start = Math.max(0, currentPage - 1 - preloadRange);
    const end = Math.min(currentChapter.files.length, currentPage + preloadRange);

    for (let i = start; i < end; i++) {
      if (i === currentPage - 1) continue; // 跳过当前页（已加载）
      const img = new Image();
      img.src = currentChapter.files[i];
    }
  }, [currentChapter, currentPage, state.mode]);

  // 是否是第一页/最后一页
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  // 计算平均高度
  const averageHeight = useMemo(() => {
    const heights = Object.values(imageHeights);
    if (heights.length === 0) return DEFAULT_ESTIMATED_HEIGHT;
    const samples = heights.slice(0, Math.min(SAMPLE_SIZE, heights.length));
    return Math.round(samples.reduce((sum, h) => sum + h, 0) / samples.length);
  }, [imageHeights]);

  // 处理图片高度变化
  const handleImageHeightChange = useCallback((index: number, height: number) => {
    setImageHeights((prev) => {
      if (prev[index] === height) return prev;
      return { ...prev, [index]: height };
    });
  }, []);

  // ============ 自动播放逻辑 ============
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setState({ isAutoPlay: false });
  }, [setState]);

  const startAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    setState({ isAutoPlay: true });

    autoPlayTimerRef.current = setInterval(() => {
      // 闭包内读取最新 URL 状态(通过 urlStateRef 镜像)
      const {
        currentPage: cp,
        currentChapterIndex: ci,
        totalPages: tp,
        isLastChapter: ilc,
      } = urlStateRef.current;
      if (cp >= tp) {
        if (ilc) {
          stopAutoPlay();
        } else {
          setChapterIndex(ci + 1);
        }
      } else {
        setPage(cp + 1);
      }
    }, state.autoPlayInterval * 1000);
  }, [state.autoPlayInterval, setState, setChapterIndex, setPage, stopAutoPlay]);

  const toggleAutoPlay = useCallback(() => {
    if (state.mode !== "single") return;

    if (state.isAutoPlay) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }, [state.isAutoPlay, state.mode, startAutoPlay, stopAutoPlay]);

  // 监听 isAutoPlay 变化，清理定时器
  useEffect(() => {
    if (!state.isAutoPlay && autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, [state.isAutoPlay]);

  // 切换模式时停止自动播放
  useEffect(() => {
    if (state.isAutoPlay && state.mode !== "single") {
      stopAutoPlay();
    }
  }, [state.mode, state.isAutoPlay, stopAutoPlay]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, []);

  // ============ 翻页操作 ============
  const handlePrevPage = useCallback(() => {
    if (state.isAutoPlay) stopAutoPlay();
    setPage(currentPage - 1);
  }, [currentPage, state.isAutoPlay, setPage, stopAutoPlay]);

  const handleNextPage = useCallback(() => {
    if (state.isAutoPlay) stopAutoPlay();
    setPage(currentPage + 1);
  }, [currentPage, state.isAutoPlay, setPage, stopAutoPlay]);

  // ============ 章节切换 ============
  const handlePrevChapter = useCallback(() => {
    if (isFirstChapter || state.isAutoPlay) return;
    stopAutoPlay();
    setChapterIndex(currentChapterIndex - 1);
  }, [isFirstChapter, currentChapterIndex, state.isAutoPlay, setChapterIndex, stopAutoPlay]);

  const handleNextChapter = useCallback(() => {
    if (isLastChapter || state.isAutoPlay) return;
    stopAutoPlay();
    setChapterIndex(currentChapterIndex + 1);
  }, [isLastChapter, currentChapterIndex, state.isAutoPlay, setChapterIndex, stopAutoPlay]);

  const handleChapterSelect = useCallback(
    (index: number) => {
      setChapterIndex(index);
      setState({ isSettingOpen: false });
    },
    [setChapterIndex, setState],
  );

  // ============ 模式切换 ============
  const handleModeChange = useCallback(
    (newMode: ReadingMode) => {
      if (state.isAutoPlay) stopAutoPlay();

      // 保存当前模式，用于判断切换方向
      const currentMode = state.mode;

      if (currentMode === "single" && newMode === "strip") {
        // 单页 → 条漫：记录当前页，切换到条漫后滚动到对应位置
        lastModeRef.current = "single";
      } else if (currentMode === "strip" && newMode === "single") {
        // 条漫 → 单页：根据当前可见图片索引设置页码
        setPage(visibleImageIndex + 1);
        lastModeRef.current = "strip";
      }

      setState({ mode: newMode });
      setSettings({ ...settings, mode: newMode });
    },
    [
      state.isAutoPlay,
      state.mode,
      visibleImageIndex,
      settings,
      setState,
      setSettings,
      setPage,
      stopAutoPlay,
    ],
  );

  // 单页 → 条漫切换后，滚动到当前页对应的位置
  useEffect(() => {
    if (state.mode === "strip" && lastModeRef.current === "single") {
      // 使用 setTimeout 确保 DOM 已经渲染
      const timer = setTimeout(() => {
        const targetIndex = currentPage - 1;
        imageRefs.current[targetIndex]?.scrollIntoView("auto");
        setVisibleImageIndex(targetIndex);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.mode, currentPage]);

  // ============ 自动播放间隔设置 ============
  const handleIntervalChange = useCallback(
    (value: number) => {
      setState({ autoPlayInterval: value });
      setSettings({ ...settings, autoPlayInterval: value });
    },
    [settings, setState, setSettings],
  );

  // ============ 鼠标悬停控制 ============
  const showToolbar = useCallback(() => {
    setState({ isHover: true });
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setState({ isHover: false });
    }, TOOLBAR_HIDE_DELAY);
  }, [setState]);

  const handleMouseEnter = useCallback(() => {
    setState({ isHover: true });
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, [setState]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setState({ isHover: false });
    }, TOOLBAR_HIDE_DELAY);
  }, [setState]);

  const handleCenterClick = useCallback(() => {
    if (state.isHover) {
      setState({ isHover: false });
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    } else {
      showToolbar();
    }
  }, [state.isHover, showToolbar, setState]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // ============ 返回详情页 ============
  const handleBack = useCallback(() => {
    stopAutoPlay();
    navigate(`/${domain}/${category}/${work?.hash_id}`);
  }, [navigate, domain, category, work, stopAutoPlay]);

  // ============ 长按滚动控制 ============
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const SCROLL_SPEED = 200; // 每秒滚动次数
  const SCROLL_DISTANCE = 30; // 每次滚动距离

  const startContinuousScroll = useCallback((direction: "up" | "down") => {
    if (scrollIntervalRef.current) return;

    scrollIntervalRef.current = setInterval(() => {
      stripContainerRef.current?.scrollBy({
        top: direction === "up" ? -SCROLL_DISTANCE : SCROLL_DISTANCE,
        behavior: "auto", // 使用 auto 更流畅
      });
    }, 1000 / SCROLL_SPEED);
  }, []);

  const stopContinuousScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => stopContinuousScroll();
  }, [stopContinuousScroll]);

  // ============ 键盘快捷键 ============
  // 使用原生事件监听，确保在设置面板关闭后才响应
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果设置面板打开，只响应 ESC 关闭面板
      if (state.isSettingOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setState({ isSettingOpen: false });
        }
        return;
      }

      // 单页模式快捷键
      if (state.mode === "single") {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            handlePrevPage();
            break;
          case "ArrowRight":
            e.preventDefault();
            handleNextPage();
            break;
          case " ":
          case "Spacebar": // 兼容旧浏览器
            e.preventDefault();
            toggleAutoPlay();
            break;
        }
      }

      // 条漫模式快捷键 - 支持长按连续滚动
      if (state.mode === "strip") {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            // 首次按键滚动一小段，然后开始连续滚动
            stripContainerRef.current?.scrollBy({ top: -SCROLL_DISTANCE, behavior: "auto" });
            startContinuousScroll("up");
            break;
          case "ArrowDown":
            e.preventDefault();
            stripContainerRef.current?.scrollBy({ top: SCROLL_DISTANCE, behavior: "auto" });
            startContinuousScroll("down");
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 松开方向键时停止连续滚动
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        stopContinuousScroll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      stopContinuousScroll();
    };
  }, [
    state.isSettingOpen,
    state.mode,
    handlePrevPage,
    handleNextPage,
    toggleAutoPlay,
    setState,
    startContinuousScroll,
    stopContinuousScroll,
  ]);

  // ============ 渲染加载状态 ============
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // ============ 渲染错误状态 ============
  if (error || !work || !currentChapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-400">
        <div className="text-6xl">📖</div>
        <p>{error || "暂无内容"}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          返回
        </button>
      </div>
    );
  }

  const title = work.detail?.title || work.work;
  const chapterName = currentChapter.name;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* ============ 单页模式 ============ */}
      {state.mode === "single" && (
        <div className="relative h-full w-full">
          {/* 图片显示区域 */}
          <div className="flex h-full w-full items-center justify-center p-4">
            {currentImageUrl ? (
              <img
                key={currentImageUrl}
                src={currentImageUrl}
                alt={`第 ${currentPage} 页`}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <BiImage className="h-12 w-12" />
                <span>暂无图片</span>
              </div>
            )}
          </div>

          {/* 点击区域 */}
          <div className="absolute inset-0 flex">
            <div
              className="flex-1"
              style={{ cursor: `url("${toPrevCursor}"), w-resize` }}
              onClick={handlePrevPage}
            />
            <div className="flex-2 cursor-pointer" onClick={handleCenterClick} />
            <div
              className="flex-1"
              style={{ cursor: `url("${toNextCursor}"), e-resize` }}
              onClick={handleNextPage}
            />
          </div>
        </div>
      )}

      {/* ============ 条漫模式 ============ */}
      {state.mode === "strip" && (
        <div
          ref={stripContainerRef}
          className="h-full w-full overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-transparent"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(82 82 91) transparent",
          }}
          onClick={handleCenterClick}
        >
          <div className="mx-auto max-w-4xl py-4">
            {currentChapter.files.map((url, index) => {
              // 计算加载优先级
              // 0 = 当前页（立即加载）
              // 1 = 下一页（预加载）
              // 2 = 其他（懒加载）
              let priority = 2;
              if (index === visibleImageIndex) {
                priority = 0; // 当前可见页
              } else if (index === visibleImageIndex + 1) {
                priority = 1; // 下一页预加载
              }

              return (
                <LazyImage
                  key={`${url}-${index}`}
                  ref={(el) => {
                    imageRefs.current[index] = el;
                  }}
                  src={url}
                  alt={`第 ${index + 1} 页`}
                  index={index}
                  estimatedHeight={averageHeight}
                  onHeightChange={(height) => handleImageHeightChange(index, height)}
                  onVisible={(idx) => setVisibleImageIndex(idx)}
                  priority={priority}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ============ 工具栏 ============ */}
      <Toolbar
        isVisible={state.isHover}
        mode={state.mode}
        currentPage={currentPage}
        totalPages={totalPages}
        chapterUnits={chapterUnits}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        isFirstChapter={isFirstChapter}
        isLastChapter={isLastChapter}
        isAutoPlay={state.isAutoPlay}
        title={title}
        chapterName={chapterName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onBack={handleBack}
        onOpenSettings={() => setState({ isSettingOpen: true })}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onToggleAutoPlay={toggleAutoPlay}
      />

      {/* ============ 设置面板 ============ */}
      <SettingsPanel
        isOpen={state.isSettingOpen}
        onClose={() => setState({ isSettingOpen: false })}
        mode={state.mode}
        isAutoPlay={state.isAutoPlay}
        autoPlayInterval={state.autoPlayInterval}
        currentChapterIndex={currentChapterIndex}
        chapterUnits={chapterUnits}
        onModeChange={handleModeChange}
        onIntervalChange={handleIntervalChange}
        onChapterSelect={handleChapterSelect}
      />

      {/* ============ 模式切换浮动按钮 ============ */}
      <button
        onClick={() => setState({ isSettingOpen: true })}
        className={cn(
          "absolute right-4 z-10 rounded-full bg-zinc-800/80 p-3 text-zinc-400 backdrop-blur-sm transition-all hover:bg-zinc-700 hover:text-white",
          state.isHover && state.mode === "single" ? "bottom-20" : "bottom-4",
        )}
      >
        {state.mode === "single" ? (
          <BiImage className="h-5 w-5" />
        ) : (
          <BiImages className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

export { default as LazyImage } from "./components/LazyImage";
export { default as SettingsPanel } from "./components/SettingsPanel";
export { default as Toolbar } from "./components/Toolbar";
export type { MangaPlayTemplateProps, ReadingMode, ChapterUnit } from "./types";
