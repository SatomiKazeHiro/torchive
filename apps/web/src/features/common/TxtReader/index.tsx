import { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { BiError, BiDownload, BiArrowBack, BiListUl, BiSearch, BiPlus, BiMinus, BiX, BiUndo, BiLayer, BiBook } from "react-icons/bi";
import { throttle } from "es-toolkit";
import { useLocalStorageState } from "ahooks";
import { cn } from "@/components/utils/common";
import type { TxtReaderProps, TxtReaderRef, TxtThemeMode, FontSize, JumpBackInfo, TocItem } from "./types";
import { TXT_THEMES, DEFAULT_SETTINGS, FONT_SIZE_MAP, LINE_HEIGHT_MAP, THEME_NAMES } from "./constants";
import { calculateProgress, calculateScrollTopFromProgress, recognizeChapter } from "./utils";
import { useVirtualList, useTextStream, useToc, useSearch } from "./hooks";
import TocDrawer from "./components/TocDrawer";
import SearchDrawer from "./components/SearchDrawer";

// 字体大小档位（模块级常量，引用稳定）
const FONT_SIZE_LIST: FontSize[] = ["small", "medium", "large", "xlarge"];

/**
 * TxtReader - TXT 阅读器组件
 *
 * 支持功能：
 * - 流式文本加载
 * - 虚拟列表渲染
 * - 三主题（纸质、羊皮纸、暗黑）
 * - 字体大小调节
 * - 目录自动生成与导航
 * - 文本搜索
 * - 进度跟踪与跳转
 * - 阅读进度记忆
 */
const TxtReader = forwardRef<TxtReaderRef, TxtReaderProps>(
  ({
    src,
    fileName,
    title,
    themeMode: propThemeMode,
    fontSize: propFontSize,
    onBack,
    onProgressChange,
    onThemeChange,
    onFontSizeChange,
  }, ref) => {
    // 合并 props 和内部状态
    const [internalThemeMode, setInternalThemeMode] = useState<TxtThemeMode>(DEFAULT_SETTINGS.themeMode);
    const [internalFontSize, setInternalFontSize] = useState<FontSize>(DEFAULT_SETTINGS.fontSize);
    
    const themeMode = propThemeMode ?? internalThemeMode;
    const fontSize = propFontSize ?? internalFontSize;
    const theme = TXT_THEMES[themeMode] ?? {};

    // ==================== 文本流式加载 ====================
    const { paragraphs, isLoading, isStreaming, hasError, paragraphsRef } = useTextStream({ src });

    // ==================== 计算样式 ====================
    const fontSizePx = FONT_SIZE_MAP[fontSize];
    const lineHeight = LINE_HEIGHT_MAP[fontSize];
    const itemHeight = fontSizePx * lineHeight;

    // ==================== 虚拟列表 ====================
    const {
      containerRef,
      scrollTop,
      handleScroll: handleVirtualScroll,
      virtualList,
    } = useVirtualList({
      itemHeight,
      totalItems: paragraphs.length,
    });

    // ==================== 进度状态 ====================
    const [progress, setProgress] = useState(0);

    // ==================== 阅读进度持久化 ====================
    const progressKey = `txt-reader-progress-${src}`;
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

    // 同步保存进度到 localStorage（用于页面刷新时立即获取）
    const syncSaveProgress = useCallback((currentProgress: number) => {
      if (currentProgress > 0) {
        const progressKey = `txt-reader-progress-${src}`;
        localStorage.setItem(progressKey, JSON.stringify({ progress: currentProgress, timestamp: Date.now() }));
      }
    }, [src]);

    // 防抖保存（用于 React state 更新）
    const autoSaveProgress = useRef(throttle((currentProgress: number) => {
      if (currentProgress > 0) {
        setSavedProgress({ progress: currentProgress, timestamp: Date.now() });
      }
    }, 2000)).current;

    // ==================== 目录管理 ====================
    const { tocItems, currentTocIndex, updateCurrentTocIndex, jumpToTocItem, setCurrentTocIndex } = useToc({
      paragraphs,
      scrollTop,
      itemHeight,
    });

    // ==================== 搜索管理 ====================
    const { searchState, setSearchState, search, jumpToResult, navigateResult, clearSearch } =
      useSearch({
        itemHeight,
      });

    // ==================== 抽屉状态 ====================
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // ==================== 跳转提示 ====================
    const [jumpBackInfo, setJumpBackInfo] = useState<JumpBackInfo | null>(null);

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
    }, [handleVirtualScroll, onProgressChange, updateCurrentTocIndex, autoSaveProgress, syncSaveProgress]);

    // 关闭搜索抽屉时清空旧的"返回"提示（一次搜索会话结束）
    useEffect(() => {
      if (!isSearchOpen) {
        setJumpBackInfo(null);
      }
    }, [isSearchOpen]);

    // ==================== 主题切换 ====================
    const toggleTheme = useCallback(() => {
      const themes: TxtThemeMode[] = ["paper", "parchment", "dark"];
      const currentIndex = themes.indexOf(themeMode);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      if (propThemeMode === undefined) {
        setInternalThemeMode(nextTheme);
      }
      onThemeChange?.(nextTheme);
    }, [themeMode, propThemeMode, onThemeChange]);

    // ==================== 字体大小控制 ====================
    const increaseFontSize = useCallback(() => {
      const currentIndex = FONT_SIZE_LIST.indexOf(fontSize);
      if (currentIndex < FONT_SIZE_LIST.length - 1) {
        const newSize = FONT_SIZE_LIST[currentIndex + 1];
        if (propFontSize === undefined) {
          setInternalFontSize(newSize);
        }
        onFontSizeChange?.(newSize);
      }
    }, [fontSize, propFontSize, onFontSizeChange]);

    const decreaseFontSize = useCallback(() => {
      const currentIndex = FONT_SIZE_LIST.indexOf(fontSize);
      if (currentIndex > 0) {
        const newSize = FONT_SIZE_LIST[currentIndex - 1];
        if (propFontSize === undefined) {
          setInternalFontSize(newSize);
        }
        onFontSizeChange?.(newSize);
      }
    }, [fontSize, propFontSize, onFontSizeChange]);

    // ==================== 保存跳转前位置（仅搜索结果点击触发） ====================
    const saveJumpBackPosition = useCallback(() => {
      if (!containerRef.current) return;
      if (jumpBackInfo) return;
      const currentScrollTop = containerRef.current.scrollTop;
      const currentProgress = calculateProgress(currentScrollTop, containerRef.current.scrollHeight, containerRef.current.clientHeight);
      if (currentProgress > 0 && currentProgress < 100) {
        setJumpBackInfo({ scrollTop: currentScrollTop, progress: currentProgress, timestamp: Date.now() });
      }
    }, [jumpBackInfo, containerRef]);

    // ==================== 返回跳转前位置 ====================
    const handleJumpBack = useCallback(() => {
      if (!jumpBackInfo || !containerRef.current) return;
      containerRef.current.scrollTop = jumpBackInfo.scrollTop;
      setJumpBackInfo(null);
    }, [jumpBackInfo, containerRef]);

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

    const handlePrevResult = useCallback(() => {
      navigateResult("prev", containerRef.current);
    }, [navigateResult, containerRef]);

    const handleNextResult = useCallback(() => {
      navigateResult("next", containerRef.current);
    }, [navigateResult, containerRef]);

    // ==================== 跳转到指定进度 ====================
    const goToProgress = useCallback((targetProgress: number) => {
      if (containerRef.current) {
        const newScrollTop = calculateScrollTopFromProgress(targetProgress, containerRef.current.scrollHeight, containerRef.current.clientHeight);
        containerRef.current.scrollTop = newScrollTop;
      }
    }, [containerRef]);

    // ==================== Ref 暴露 ====================
    useImperativeHandle(ref, () => ({
      progress,
      goToProgress,
      increaseFontSize,
      decreaseFontSize,
    }));

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
      <div className={cn("flex h-full w-full flex-col", theme.bg)}>
        {/* ========== 顶部固定导航栏 ========== */}
        <div className={cn("flex items-center justify-between border-b px-4 py-2 shrink-0", theme.line)}>
          {/* 左侧：返回 + 标题 */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className={cn("flex items-center gap-1 rounded p-1.5 text-sm transition-colors shrink-0", theme.text, theme.buttonHover)}
                title="返回"
              >
                <BiArrowBack className="h-4 w-4" />
                <span className="hidden sm:inline">返回</span>
              </button>
            )}
            <div className={cn("h-4 w-px shrink-0", themeMode === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')} />
            <h1 className={cn("text-sm font-medium truncate", theme.text)} title={displayTitle}>
              {displayTitle}
            </h1>
          </div>

          {/* 中间：进度信息 */}
          <div className="flex items-center gap-3 px-4 shrink-0">
            <span className={cn("text-sm tabular-nums", theme.text)}>
              {progress}%
            </span>
            {paragraphs.length > 0 && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full", themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100', theme.text)}>
                {paragraphs.length.toLocaleString()} 段
              </span>
            )}
          </div>

          {/* 右侧：目录 + 搜索 + 字体 + 主题 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 目录 */}
            <button
              onClick={() => setIsTocOpen(true)}
              className={cn("flex items-center gap-1.5 rounded p-1.5 text-sm transition-colors", theme.text, theme.buttonHover)}
              title="目录"
            >
              <BiListUl className="h-4 w-4" />
              <span className="hidden sm:inline">目录</span>
            </button>

            {/* 搜索 */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={cn("flex items-center gap-1.5 rounded p-1.5 text-sm transition-colors", theme.text, theme.buttonHover)}
              title="搜索"
            >
              <BiSearch className="h-4 w-4" />
              <span className="hidden sm:inline">搜索</span>
            </button>

            <div className={cn("w-px h-4", themeMode === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')} />

            {/* 字体大小控制 */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize === 'small'}
                className={cn("rounded p-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
                title="减小字体"
              >
                <BiMinus className="h-4 w-4" />
              </button>
              <span className={cn("w-12 text-center text-sm tabular-nums", theme.text)}>
                {fontSizePx}px
              </span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize === 'xlarge'}
                className={cn("rounded p-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
                title="增大字体"
              >
                <BiPlus className="h-4 w-4" />
              </button>
            </div>

            <div className={cn("w-px h-4", themeMode === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')} />

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className={cn("flex items-center gap-1.5 rounded p-1.5 text-sm transition-colors", theme.text, theme.buttonHover)}
              title={`切换主题 (当前: ${THEME_NAMES[themeMode]})`}
            >
              <ThemeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{THEME_NAMES[themeMode]}</span>
            </button>
          </div>
        </div>

        {/* ========== TXT 内容区域 ========== */}
        <div ref={containerRef} className={cn("flex-1 overflow-auto scrollbar-thin", theme.contentBg)} onScroll={handleScroll}>
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
                marginTop: "24px",
                marginBottom: "24px",
              }}
            >
              <div className="absolute right-6 left-0" style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleParagraphs.map((para) => {
                  // 直接根据内容判断是否是章节标题
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

        {/* 跳转返回提示 */}
        {jumpBackInfo && (
          <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-zinc-800/95 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur-sm">
              <BiUndo className="h-4 w-4" />
              <span>返回 {Math.round(jumpBackInfo.progress)}% 的位置</span>
              <button
                onClick={handleJumpBack}
                className="ml-2 rounded-full bg-zinc-700 px-3 py-1 text-xs transition-colors hover:bg-zinc-600"
              >
                返回
              </button>
              <button
                onClick={() => setJumpBackInfo(null)}
                className="ml-1 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                title="关闭"
              >
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
          onPrevResult={handlePrevResult}
          onNextResult={handleNextResult}
          onClearSearch={clearSearch}
        />
      </div>
    );
  }
);

TxtReader.displayName = "TxtReader";

export default TxtReader;
export type { TxtReaderProps, TxtReaderRef, TxtThemeMode, ReadingMode, FontSize } from "./types";
