import { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { throttle } from "es-toolkit";
import {
  BiHome,
  BiArrowBack,
  BiCog,
  BiChevronLeft,
  BiChevronRight,
  BiBook,
  BiLayer,
  BiPlus,
  BiMinus,
  BiSearch,
  BiListUl,
  BiError,
  BiDownload,
  BiX,
  BiUndo,
} from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { useLocalStorageState } from "ahooks";
import type { MobileTxtReaderProps, MobileTxtReaderRef, ThemeMode, FontSize, JumpBackInfo, TocItem } from "./types";
import { THEME_STYLES, FONT_SIZE_MAP, LINE_HEIGHT_MAP, DEFAULT_SETTINGS, THEME_NAMES } from "./constants";
import { calculateProgress, calculateScrollTopFromProgress, recognizeChapter } from "./utils";
import { useVirtualList, useTextStream, useToc, useSearch } from "./hooks";
import TocDrawer from "./components/TocDrawer";
import SearchDrawer from "./components/SearchDrawer";

/**
 * MobileTxtReader - 移动端 TXT 阅读器
 * 
 * 特色交互：
 * - 点击内容区域切换上下导航栏的显示/隐藏
 * - 顶部导航栏：返回、标题、设置
 * - 底部导航栏：进度条、章节切换、字体控制、主题、目录、搜索
 * - 支持目录抽屉、搜索抽屉
 * - 支持跳转返回提示
 */

// 字体大小档位（模块级常量，引用稳定）
const FONT_SIZE_LIST: FontSize[] = ["small", "medium", "large", "xlarge"];

const MobileTxtReader = forwardRef<MobileTxtReaderRef, MobileTxtReaderProps>(
  ({
    src,
    fileName,
    title,
    themeMode: propThemeMode,
    fontSize: propFontSize,
    chapterUnits = [],
    currentChapterIndex = 0,
    isFirstChapter = true,
    isLastChapter = true,
    onBack,
    onProgressChange,
    onThemeChange,
    onFontSizeChange,
    onPrevChapter,
    onNextChapter,
    onOpenSettings,
  }, ref) => {
    // 合并 props 和内部状态
    const [internalThemeMode, setInternalThemeMode] = useState<ThemeMode>(DEFAULT_SETTINGS.themeMode);
    const [internalFontSize, setInternalFontSize] = useState<FontSize>(DEFAULT_SETTINGS.fontSize);
    
    const themeMode = propThemeMode ?? internalThemeMode;
    const fontSize = propFontSize ?? internalFontSize;
    const theme = THEME_STYLES[themeMode];

    // 导航栏显示状态 - 核心交互状态
    const [isNavVisible, setIsNavVisible] = useState(true);

    // ==================== 文本流式加载 ====================
    const { paragraphs, isLoading, isStreaming, hasError, paragraphsRef } = useTextStream({ src });

    // ==================== 计算样式 ====================
    const fontSizePx = FONT_SIZE_MAP[fontSize];
    const lineHeight = LINE_HEIGHT_MAP[fontSize];
    const itemHeight = fontSizePx * lineHeight;

    // ==================== 虚拟列表 ====================
    const { containerRef, scrollTop, handleScroll: handleVirtualScroll, virtualList } = useVirtualList({
      itemHeight,
      totalItems: paragraphs.length,
    });

    // ==================== 进度状态 ====================
    const [progress, setProgress] = useState(0);

    // ==================== 目录管理 ====================
    const { tocItems, currentTocIndex, updateCurrentTocIndex, jumpToTocItem, setCurrentTocIndex } = useToc({
      paragraphs,
      scrollTop,
      itemHeight,
    });

    // ==================== 搜索管理 ====================
    const { searchState, setSearchState, search, jumpToResult, navigateResult, clearSearch } = useSearch({ itemHeight });

    // ==================== 抽屉状态 ====================
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // ==================== 跳转提示 ====================
    const [jumpBackInfo, setJumpBackInfo] = useState<JumpBackInfo | null>(null);

    // ==================== 进度条拖拽状态 ====================
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(progress);
    const progressRef = useRef<HTMLDivElement>(null);

    // ==================== 点击内容区域切换导航栏 ====================
    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // 1. 排除复制操作
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      // 2. 排除特定元素（按钮、链接等）
      const path = e.nativeEvent.composedPath() as HTMLElement[];
      const isClickOnInteractive = path.some((el) => {
        if (!(el instanceof Element)) return false;
        const tagName = el.tagName;
        return tagName === 'A' || tagName === 'BUTTON' || el.hasAttribute('role');
      });

      if (isClickOnInteractive) return;

      // 3. 切换导航栏
      setIsNavVisible((prev) => !prev);
    };

    // ==================== 同步保存（提前声明以便 handleScroll 引用） ====================
    const syncSaveProgress = useCallback((currentProgress: number) => {
      if (currentProgress > 0) {
        const progressKey = `mobile-reader-progress-${src}`;
        localStorage.setItem(progressKey, JSON.stringify({ progress: currentProgress, timestamp: Date.now() }));
      }
    }, [src]);

    // 防抖保存（提前声明以便 handleScroll 引用）
    const autoSaveProgress = useRef(throttle((currentProgress: number) => {
      if (currentProgress > 0) {
        setSavedProgress({ progress: currentProgress, timestamp: Date.now() });
      }
    }, 2000)).current;

    // ==================== 滚动处理 ====================
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      handleVirtualScroll(e);
      const target = e.currentTarget;
      const currentProgress = calculateProgress(target.scrollTop, target.scrollHeight, target.clientHeight);
      setProgress(currentProgress);
      onProgressChange?.(currentProgress);
      // 同步保存确保刷新时能拿到最新进度
      syncSaveProgress(currentProgress);
      autoSaveProgress(currentProgress);
      updateCurrentTocIndex();
    }, [handleVirtualScroll, onProgressChange, updateCurrentTocIndex, syncSaveProgress, autoSaveProgress]);

    // 关闭搜索抽屉时清空旧的"返回"提示（一次搜索会话结束）
    useEffect(() => {
      if (!isSearchOpen) {
        setJumpBackInfo(null);
      }
    }, [isSearchOpen]);

    // ==================== 主题切换 ====================
    const handleToggleTheme = useCallback(() => {
      const themes: ThemeMode[] = ["paper", "parchment", "dark"];
      const currentIndex = themes.indexOf(themeMode);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      if (propThemeMode === undefined) setInternalThemeMode(nextTheme);
      onThemeChange?.(nextTheme);
    }, [themeMode, propThemeMode, onThemeChange]);

    // ==================== 字体大小控制 ====================
    const increaseFontSize = useCallback(() => {
      const currentIndex = FONT_SIZE_LIST.indexOf(fontSize);
      if (currentIndex < FONT_SIZE_LIST.length - 1) {
        const newSize = FONT_SIZE_LIST[currentIndex + 1];
        if (propFontSize === undefined) setInternalFontSize(newSize);
        onFontSizeChange?.(newSize);
      }
    }, [fontSize, propFontSize, onFontSizeChange]);

    const decreaseFontSize = useCallback(() => {
      const currentIndex = FONT_SIZE_LIST.indexOf(fontSize);
      if (currentIndex > 0) {
        const newSize = FONT_SIZE_LIST[currentIndex - 1];
        if (propFontSize === undefined) setInternalFontSize(newSize);
        onFontSizeChange?.(newSize);
      }
    }, [fontSize, propFontSize, onFontSizeChange]);

    // ==================== 保存跳转前位置（仅搜索结果点击触发） ====================
    const saveJumpBackPosition = useCallback(() => {
      if (!containerRef.current) return;
      // 如果已有提示且用户未关闭，不更新
      if (jumpBackInfo) return;
      const currentScrollTop = containerRef.current.scrollTop;
      const currentProgress = calculateProgress(currentScrollTop, containerRef.current.scrollHeight, containerRef.current.clientHeight);
      if (currentProgress > 0 && currentProgress < 100) {
        setJumpBackInfo({ scrollTop: currentScrollTop, progress: currentProgress, timestamp: Date.now() });
      }
    }, [containerRef, jumpBackInfo]);

    // ==================== 返回跳转前位置 ====================
    const handleJumpBack = useCallback(() => {
      if (!jumpBackInfo || !containerRef.current) return;
      containerRef.current.scrollTop = jumpBackInfo.scrollTop;
      setJumpBackInfo(null);
    }, [jumpBackInfo, containerRef]);

    // ==================== 进度条控制 ====================
    const calculateProgressFromX = useCallback((clientX: number) => {
      if (!progressRef.current) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min(100, (x / rect.width) * 100));
    }, []);

    const throttledProgressChange = useRef(throttle((newProgress: number) => {
      if (containerRef.current) {
        const newScrollTop = calculateScrollTopFromProgress(newProgress, containerRef.current.scrollHeight, containerRef.current.clientHeight);
        containerRef.current.scrollTop = newScrollTop;
      }
    }, 50)).current;

    const handleProgressClick = useCallback((e: React.MouseEvent) => {
      const newProgress = calculateProgressFromX(e.clientX);
      setLocalProgress(newProgress);
      if (containerRef.current) {
        const newScrollTop = calculateScrollTopFromProgress(newProgress, containerRef.current.scrollHeight, containerRef.current.clientHeight);
        containerRef.current.scrollTop = newScrollTop;
      }
    }, [calculateProgressFromX, containerRef]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      setIsDragging(true);
      const newProgress = calculateProgressFromX(e.clientX);
      setLocalProgress(newProgress);
    }, [calculateProgressFromX]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const newProgress = calculateProgressFromX(e.clientX);
      setLocalProgress(newProgress);
      throttledProgressChange(newProgress);
    }, [isDragging, calculateProgressFromX, throttledProgressChange]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseLeave = useCallback(() => setIsDragging(false), []);

    // ==================== 目录跳转 ====================
    const handleTocSelect = useCallback((item: TocItem) => {
      const index = tocItems.findIndex((tocItem) => tocItem.id === item.id);
      if (index !== -1) setCurrentTocIndex(index);
      jumpToTocItem(item, containerRef.current);
    }, [tocItems, setCurrentTocIndex, jumpToTocItem, containerRef]);

    // ==================== 搜索处理 ====================
    const handleSearch = useCallback((keyword: string) => {
      search(keyword, paragraphsRef.current);
    }, [search, paragraphsRef]);

    const handleResultSelect = useCallback((result: import("./types").SearchResult) => {
      saveJumpBackPosition();
      const index = searchState.results.findIndex((r) => r.id === result.id);
      if (index !== -1) {
        setSearchState((prev) => ({ ...prev, currentResultIndex: index }));
        jumpToResult(result, containerRef.current);
      }
    }, [searchState.results, setSearchState, jumpToResult, containerRef, saveJumpBackPosition]);

    // ==================== 阅读进度持久化 ====================
    const progressKey = `mobile-reader-progress-${src}`;
    const [savedProgress, setSavedProgress] = useLocalStorageState<{ progress: number; timestamp: number }>(progressKey, {
      defaultValue: undefined,
    });

    // 首次加载时恢复进度（使用 ref 确保只执行一次）
    const hasRestoredProgressRef = useRef(false);
    useEffect(() => {
      if (hasRestoredProgressRef.current) return;
      if (savedProgress && savedProgress.progress > 0 && containerRef.current && !isLoading && paragraphs.length > 0) {
        hasRestoredProgressRef.current = true;
        const scrollTop = calculateScrollTopFromProgress(savedProgress.progress, containerRef.current.scrollHeight, containerRef.current.clientHeight);
        containerRef.current.scrollTop = scrollTop;
        setProgress(savedProgress.progress);
      }
    }, [savedProgress, isLoading, paragraphs.length, src, containerRef]);

    // 在滚动时自动保存进度
    useEffect(() => {
      if (progress > 0) {
        autoSaveProgress(progress);
      }
    }, [progress, autoSaveProgress]);

    // ==================== 跳转到指定进度 ====================
    const goToProgress = useCallback((targetProgress: number) => {
      saveJumpBackPosition();
      if (containerRef.current) {
        const newScrollTop = calculateScrollTopFromProgress(targetProgress, containerRef.current.scrollHeight, containerRef.current.clientHeight);
        containerRef.current.scrollTop = newScrollTop;
      }
    }, [saveJumpBackPosition, containerRef]);

    // ==================== Ref 暴露 ====================
    useImperativeHandle(ref, () => ({
      progress,
      goToProgress,
      increaseFontSize,
      decreaseFontSize,
      toggleToc: () => setIsTocOpen((prev) => !prev),
      toggleSearch: () => setIsSearchOpen((prev) => !prev),
      hasToc: () => tocItems.length > 0,
      isSearchOpen: () => isSearchOpen,
      isTocOpen: () => isTocOpen,
      closeSearch: () => setIsSearchOpen(false),
      closeToc: () => setIsTocOpen(false),
      toggleNav: () => setIsNavVisible((prev) => !prev),
    }));

    // ==================== Esc 键处理 ====================
    // 注意：完整的 Esc 优先级（设置弹窗 -> 搜索 -> 目录 -> 导航栏）由父组件 Ebook 统一处理
    // 这里只处理当导航栏获得焦点时的 Esc 切换
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        // 当有弹窗打开时，不处理（由父组件处理）
        if (isSearchOpen || isTocOpen) return;
        
        // 只有没有弹窗时，才切换导航栏
        e.preventDefault();
        setIsNavVisible((prev) => !prev);
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSearchOpen, isTocOpen]);

    // ==================== 渲染内容 ====================
    const { startIndex, endIndex, offsetY, totalHeight } = virtualList;
    const visibleParagraphs = paragraphs.slice(startIndex, endIndex);
    const displayTitle = title || fileName;
    const ThemeIcon = themeMode === "parchment" ? BiLayer : BiBook;

    // ==================== 错误状态 ====================
    if (hasError) {
      return (
        <div className={cn("flex h-full flex-col items-center justify-center gap-4 p-8", theme.bg)}>
          <BiError className="h-16 w-16 text-zinc-300" />
          <p className="text-center text-zinc-500">文本加载失败</p>
          <p className="max-w-md truncate text-sm text-zinc-400">{fileName}</p>
          <a
            href={src}
            download
            className="mt-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-2xs transition-colors hover:bg-zinc-50"
          >
            <span className="flex items-center gap-2">
              <BiDownload className="h-4 w-4" />
              下载查看
            </span>
          </a>
        </div>
      );
    }

    return (
      <div className={cn("relative h-full w-full overflow-hidden", theme.bg)}>
        {/* ============ 主内容区域 ============ */}
        <div
          ref={containerRef}
          className={cn(
            "h-full w-full overflow-auto select-text",
            "scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            isTocOpen && "lg:pl-80",
            isSearchOpen && "lg:pr-96"
          )}
          onScroll={handleScroll}
          onClick={handleContainerClick}
        >
          {isLoading && paragraphs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          ) : (
            <div
              className="relative mx-auto max-w-3xl px-6"
              style={{
                height: totalHeight + (typeof window !== "undefined" ? window.innerHeight * 0.5 : 400),
                // 固定 padding，不随导航栏变化，避免内容移动
                paddingTop: "56px",
                paddingBottom: "120px",
              }}
            >
              <div className="absolute right-6 left-0" style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleParagraphs.map((para) => {
                  // 直接根据内容判断是否是章节标题，不依赖异步生成的 tocItems
                  const isChapterTitle = recognizeChapter(para.content) !== null;
                  return (
                    <p
                      key={para.id}
                      className={cn(
                        "px-6 py-2 text-justify font-sans",
                        theme.text,
                        theme.selection,
                        isChapterTitle && "my-4 font-bold",
                        !isChapterTitle && "indent-8"
                      )}
                      style={{
                        fontSize: isChapterTitle ? `${fontSizePx * 1.3}px` : `${fontSizePx}px`,
                        lineHeight: `${lineHeight}`,
                      }}
                    >
                      {para.content}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {isStreaming && (
            <div className="fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-zinc-800/80 px-4 py-2 text-xs text-zinc-300 backdrop-blur-sm">
              加载中...
            </div>
          )}
        </div>

        {/* ============ 顶部导航栏 ============ */}
        <div
          className={cn(
            "pointer-events-auto absolute top-0 right-0 left-0 z-[70] transition-transform duration-300",
            isNavVisible ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className={cn("backdrop-blur-sm", theme.navBg)}>
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              {/* 左侧 */}
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <BiHome className="h-4 w-4" />
                  <span className="hidden sm:inline">首页</span>
                </Link>
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <BiArrowBack className="h-4 w-4" />
                  <span className="hidden sm:inline">返回</span>
                </button>
              </div>

              {/* 中间 - 标题 */}
              <div className="flex flex-1 items-center justify-center px-4">
                <div className="flex max-w-md items-center gap-2 truncate text-sm">
                  <span className={cn("font-medium", theme.navText)}>{displayTitle}</span>
                  {chapterUnits[currentChapterIndex]?.name && chapterUnits[currentChapterIndex].name !== "本篇" && (
                    <>
                      <span className="text-zinc-600">/</span>
                      <span className="text-zinc-400">{chapterUnits[currentChapterIndex].name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 右侧 */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{Math.round(progress)}%</span>
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <BiCog className="h-4 w-4" />
                  <span className="hidden sm:inline">设置</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ 底部工具栏 ============ */}
        <div
          className={cn(
            "pointer-events-auto absolute right-0 bottom-0 left-0 z-[70] transition-transform duration-300",
            isNavVisible ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className={cn("backdrop-blur-sm", theme.navBg)}>
            {/* 进度条区域 */}
            <div className={cn("border-b px-4 py-2", theme.navBorder)}>
              <div className="mx-auto flex max-w-7xl items-center gap-3">
                <span className="shrink-0 text-[10px] text-zinc-500">进度</span>
                <div
                  ref={progressRef}
                  className={cn("group relative h-2 flex-1 cursor-pointer rounded-full", theme.progressBg)}
                  onClick={handleProgressClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-75 group-hover:opacity-80", theme.progressFill)}
                    style={{ width: `${isDragging ? localProgress : progress}%` }}
                  />
                  <div
                    className={cn(
                      "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-zinc-300 shadow transition-all",
                      "opacity-0 group-hover:opacity-100",
                      isDragging && "scale-125 opacity-100"
                    )}
                    style={{ left: `calc(${isDragging ? localProgress : progress}% - 6px)` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[10px] text-zinc-400">
                  {Math.round(isDragging ? localProgress : progress)}%
                </span>
              </div>
            </div>

            {/* 控制按钮区域 */}
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              {/* 左侧：章节切换 + 目录 */}
              <div className="flex items-center gap-2">
                {chapterUnits.length > 1 && (
                  <button
                    onClick={onPrevChapter}
                    disabled={isFirstChapter}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      isFirstChapter ? "cursor-not-allowed text-zinc-600" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    <BiChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">上一章</span>
                  </button>
                )}
                {tocItems.length > 0 && (
                  <button
                    onClick={() => {
                      setIsNavVisible(false); // 熄灭导航栏
                      setIsTocOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    <BiListUl className="h-4 w-4" />
                    <span className="hidden sm:inline">目录</span>
                  </button>
                )}
              </div>

              {/* 中间控制区 */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsNavVisible(false); // 熄灭导航栏
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                  <BiSearch className="h-4 w-4" />
                  <span className="hidden sm:inline">搜索</span>
                </button>

                <div className="flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1">
                  <button
                    onClick={decreaseFontSize}
                    disabled={fontSize === "small"}
                    className={cn("rounded p-1.5 text-zinc-400 transition-colors", fontSize === "small" ? "opacity-50" : "hover:bg-zinc-700 hover:text-white")}
                  >
                    <BiMinus className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs text-zinc-500">
                    {fontSize === "small" && "小"}
                    {fontSize === "medium" && "中"}
                    {fontSize === "large" && "大"}
                    {fontSize === "xlarge" && "特大"}
                  </span>
                  <button
                    onClick={increaseFontSize}
                    disabled={fontSize === "xlarge"}
                    className={cn("rounded p-1.5 text-zinc-400 transition-colors", fontSize === "xlarge" ? "opacity-50" : "hover:bg-zinc-700 hover:text-white")}
                  >
                    <BiPlus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleToggleTheme}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                  <ThemeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{THEME_NAMES[themeMode]}</span>
                </button>
              </div>

              {/* 右侧 */}
              <div className="flex items-center gap-2">
                {chapterUnits.length > 1 && (
                  <button
                    onClick={onNextChapter}
                    disabled={isLastChapter}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      isLastChapter ? "cursor-not-allowed text-zinc-600" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    <span className="hidden sm:inline">下一章</span>
                    <BiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 跳转返回提示 */}
        {jumpBackInfo && (
          <div className="fixed bottom-24 left-1/2 z-[65] -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-zinc-800/95 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur-sm">
              <BiUndo className="h-4 w-4" />
              <span>返回 {Math.round(jumpBackInfo.progress)}% 的进度</span>
              <button onClick={handleJumpBack} className="ml-2 rounded-full bg-zinc-700 px-3 py-1 text-xs hover:bg-zinc-600">返回</button>
              <button onClick={() => setJumpBackInfo(null)} className="ml-1 rounded-full p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200">
                <BiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 目录抽屉 */}
        <TocDrawer
          isOpen={isTocOpen}
          onClose={() => setIsTocOpen(false)}
          tocItems={tocItems}
          currentTocIndex={currentTocIndex}
          themeMode={themeMode}
          onTocSelect={handleTocSelect}
        />

        {/* 搜索抽屉 */}
        <SearchDrawer
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchState={searchState}
          themeMode={themeMode}
          onSearch={handleSearch}
          onResultSelect={handleResultSelect}
          onPrevResult={() => navigateResult("prev", containerRef.current)}
          onNextResult={() => navigateResult("next", containerRef.current)}
          onClearSearch={clearSearch}
        />
      </div>
    );
  }
);

MobileTxtReader.displayName = "MobileTxtReader";

export default MobileTxtReader;
export type { MobileTxtReaderProps, MobileTxtReaderRef, ThemeMode, FontSize } from "./types";
