import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { BiError, BiDownload, BiChevronLeft, BiChevronRight, BiArrowBack, BiBook, BiSun } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import type { PdfReaderProps, PdfReaderRef, PdfThemeMode, ReadingMode } from "./types";
import { PDF_THEMES, DEFAULT_SETTINGS } from "./constants";

// 设置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// 页面渲染状态
type PageRenderState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * PdfReader - PDF 阅读器组件
 * 
 * 支持功能：
 * - 翻页/滚动两种阅读模式
 * - 双主题（明亮、暗黑）
 * - 缩放控制
 * - 懒加载（滚动模式）
 * - 页码跳转
 */
const PdfReader = forwardRef<PdfReaderRef, PdfReaderProps>(
  ({
    src,
    fileName,
    title,
    themeMode: propThemeMode,
    readingMode: propReadingMode,
    scale: propScale,
    onBack,
    onProgressChange,
    onThemeChange,
    onReadingModeChange,
    onScaleChange,
  }, ref) => {
    // 合并 props 和内部状态
    const [internalThemeMode, setInternalThemeMode] = useState<PdfThemeMode>(DEFAULT_SETTINGS.themeMode);
    const [internalReadingMode, setInternalReadingMode] = useState<ReadingMode>(DEFAULT_SETTINGS.readingMode);
    const [internalScale, setInternalScale] = useState<number>(DEFAULT_SETTINGS.scale);
    
    const themeMode = propThemeMode ?? internalThemeMode;
    const readingMode = propReadingMode ?? internalReadingMode;
    const scale = propScale ?? internalScale;
    
    const isScrollMode = readingMode === "scroll";
    const theme = PDF_THEMES[themeMode];

    // PDF 状态
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [pageRenderStates, setPageRenderStates] = useState<Record<number, PageRenderState>>({});

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageObserverRef = useRef<IntersectionObserver | null>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // ==================== PDF 加载 ====================
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setPageNumber(1);
      
      const initialStates: Record<number, PageRenderState> = {};
      for (let i = 1; i <= numPages; i++) {
        initialStates[i] = 'idle';
      }
      setPageRenderStates(initialStates);
      
      onProgressChange?.(0);
    }, [onProgressChange]);

    const onDocumentLoadError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
    }, []);

    // ==================== 页面控制 ====================
    const goToPage = useCallback((page: number) => {
      if (page >= 1 && page <= numPages) {
        setPageNumber(page);
        onProgressChange?.(Math.round((page / numPages) * 100));
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, [numPages, onProgressChange]);

    const prevPage = useCallback(() => {
      if (pageNumber > 1) {
        goToPage(pageNumber - 1);
      }
    }, [pageNumber, goToPage]);

    const nextPage = useCallback(() => {
      if (pageNumber < numPages) {
        goToPage(pageNumber + 1);
      }
    }, [pageNumber, numPages, goToPage]);

    // ==================== 缩放控制 ====================
    const zoomIn = useCallback(() => {
      const newScale = Math.min(scale + DEFAULT_SETTINGS.scaleStep, DEFAULT_SETTINGS.maxScale);
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      onScaleChange?.(newScale);
    }, [scale, propScale, onScaleChange]);

    const zoomOut = useCallback(() => {
      const newScale = Math.max(scale - DEFAULT_SETTINGS.scaleStep, DEFAULT_SETTINGS.minScale);
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      onScaleChange?.(newScale);
    }, [scale, propScale, onScaleChange]);

    // ==================== 主题控制 ====================
    const toggleTheme = useCallback(() => {
      const newTheme: PdfThemeMode = themeMode === 'light' ? 'dark' : 'light';
      if (propThemeMode === undefined) {
        setInternalThemeMode(newTheme);
      }
      onThemeChange?.(newTheme);
    }, [themeMode, propThemeMode, onThemeChange]);

    // ==================== 阅读模式控制 ====================
    const toggleReadingMode = useCallback(() => {
      const newMode: ReadingMode = readingMode === 'page' ? 'scroll' : 'page';
      if (propReadingMode === undefined) {
        setInternalReadingMode(newMode);
      }
      onReadingModeChange?.(newMode);
    }, [readingMode, propReadingMode, onReadingModeChange]);

    // ==================== Ref 暴露 ====================
    useImperativeHandle(ref, () => ({
      currentPage: pageNumber,
      totalPages: numPages,
      goToPage,
      prevPage,
      nextPage,
      zoomIn,
      zoomOut,
    }));

    // ==================== 滚动模式：懒加载 ====================
    useEffect(() => {
      if (!isScrollMode || numPages === 0) return;

      if (pageObserverRef.current) {
        pageObserverRef.current.disconnect();
      }

      pageObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            
            if (entry.isIntersecting) {
              setPageRenderStates(prev => {
                if (prev[pageNum] === 'idle') {
                  return { ...prev, [pageNum]: 'loading' };
                }
                return prev;
              });
            }
          });
        },
        {
          root: scrollContainerRef.current,
          rootMargin: '200px 0px',
          threshold: 0.1,
        }
      );

      Object.values(pageRefs.current).forEach((el) => {
        if (el && pageObserverRef.current) {
          pageObserverRef.current.observe(el);
        }
      });

      return () => {
        pageObserverRef.current?.disconnect();
      };
    }, [isScrollMode, numPages]);

    // ==================== 滚动模式：进度跟踪 ====================
    useEffect(() => {
      if (!isScrollMode || numPages === 0) return;

      const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const scrollTop = scrollContainerRef.current.scrollTop;
        const containerHeight = scrollContainerRef.current.clientHeight;
        const centerLine = scrollTop + containerHeight / 2;

        let currentPage = 1;
        for (let i = 1; i <= numPages; i++) {
          const pageEl = pageRefs.current[i];
          if (pageEl) {
            const rect = pageEl.getBoundingClientRect();
            const pageTop = rect.top + scrollTop - (scrollContainerRef.current?.getBoundingClientRect().top || 0);
            const pageCenter = pageTop + rect.height / 2;
            
            if (pageCenter <= centerLine) {
              currentPage = i;
            } else {
              break;
            }
          }
        }

        setPageNumber(currentPage);
        onProgressChange?.(Math.round((currentPage / numPages) * 100));
      };

      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }, [isScrollMode, numPages, onProgressChange]);

    // ==================== 页面渲染处理 ====================
    const handlePageRenderSuccess = useCallback((pageNum: number) => {
      setPageRenderStates(prev => ({ ...prev, [pageNum]: 'loaded' }));
    }, []);

    const registerPageRef = useCallback((el: HTMLDivElement | null, pageNum: number) => {
      if (el) {
        pageRefs.current[pageNum] = el;
        if (pageObserverRef.current) {
          pageObserverRef.current.observe(el);
        }
      }
    }, []);

    // ==================== 渲染页面 ====================
    const renderScrollPage = useCallback((pageNum: number) => {
      const renderState = pageRenderStates[pageNum];
      const shouldRender = renderState === 'loading' || renderState === 'loaded';

      return (
        <div
          key={`page-wrapper-${pageNum}`}
          ref={(el) => registerPageRef(el, pageNum)}
          data-page-number={pageNum}
          className="flex justify-center py-4"
          style={{ minHeight: '200px' }}
        >
          {shouldRender ? (
            <Page
              pageNumber={pageNum}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className={cn("shadow-md", theme.shadow)}
              canvasBackground={theme.canvasBg}
              onRenderSuccess={() => handlePageRenderSuccess(pageNum)}
              loading={
                <div 
                  className={cn(
                    "flex items-center justify-center rounded",
                    themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                  )}
                  style={{ width: `${scale * 600}px`, height: `${scale * 800}px` }}
                >
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                </div>
              }
            />
          ) : (
            <div 
              className={cn(
                "flex items-center justify-center rounded",
                themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
              )}
              style={{ width: `${scale * 600}px`, height: `${scale * 800}px` }}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
            </div>
          )}
        </div>
      );
    }, [scale, themeMode, theme, pageRenderStates, registerPageRef, handlePageRenderSuccess]);

    const renderAllPages = useMemo(() => {
      if (!isScrollMode || numPages === 0) return null;
      return Array.from({ length: numPages }, (_, i) => renderScrollPage(i + 1));
    }, [isScrollMode, numPages, renderScrollPage]);

    // ==================== 错误状态 ====================
    if (hasError) {
      return (
        <div className={cn("flex h-full flex-col items-center justify-center gap-4 p-8", theme.bg)}>
          <BiError className="h-16 w-16 text-zinc-300" />
          <p className="text-center text-zinc-500">PDF 加载失败</p>
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

    const displayTitle = title || fileName;

    return (
      <div
        ref={containerRef}
        className={cn("flex h-full w-full flex-col", theme.navBg)}
      >
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

          {/* 中间：页码信息 */}
          <div className="flex items-center gap-3 px-4 shrink-0">
            <span className={cn("text-sm tabular-nums", theme.text)}>
              {pageNumber} / {numPages || '-'}
            </span>
            {numPages > 0 && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full", theme.pageInfoBg, theme.text)}>
                {Math.round((pageNumber / numPages) * 100)}%
              </span>
            )}
          </div>

          {/* 右侧：缩放 + 主题 + 阅读模式 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 缩放控制 */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={zoomOut}
                disabled={scale <= DEFAULT_SETTINGS.minScale}
                className={cn("rounded p-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
                title="缩小"
              >
                -
              </button>
              <span className={cn("w-12 text-center text-sm tabular-nums", theme.text)}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= DEFAULT_SETTINGS.maxScale}
                className={cn("rounded p-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
                title="放大"
              >
                +
              </button>
            </div>

            <div className={cn("w-px h-4", themeMode === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')} />

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className={cn("flex items-center gap-1.5 rounded p-1.5 text-sm transition-colors", theme.text, theme.buttonHover)}
              title={themeMode === 'light' ? '切换到暗黑主题' : '切换到明亮主题'}
            >
              <BiSun className={cn("h-4 w-4", themeMode === 'light' ? 'text-orange-500' : 'text-zinc-400')} />
              <span className="hidden sm:inline">{themeMode === 'light' ? '明亮' : '暗黑'}</span>
            </button>

            <div className={cn("w-px h-4", themeMode === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')} />

            {/* 阅读模式切换 */}
            <button
              onClick={toggleReadingMode}
              className={cn("flex items-center gap-1.5 rounded p-1.5 text-sm transition-colors", theme.text, theme.buttonHover)}
              title={isScrollMode ? '切换到翻页模式' : '切换到滚动模式'}
            >
              <BiBook className="h-4 w-4" />
              <span className="hidden sm:inline">{isScrollMode ? '滚动' : '翻页'}</span>
            </button>
          </div>
        </div>

        {/* ========== PDF 内容区域 ========== */}
        <div ref={scrollContainerRef} className={cn("flex-1 overflow-auto scrollbar-thin", theme.bg)}>
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          )}
          
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            {isScrollMode ? (
              <div className="flex flex-col items-center py-8">
                {renderAllPages}
              </div>
            ) : (
              <div className="flex min-h-full items-start justify-center py-8">
                <Page
                  key={`page-${pageNumber}-${scale}`}
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className={cn("shadow-lg", theme.shadow)}
                  canvasBackground={theme.canvasBg}
                  loading={
                    <div 
                      className={cn("flex items-center justify-center rounded", themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100')}
                      style={{ width: `${scale * 600}px`, height: `${scale * 800}px` }}
                    >
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                    </div>
                  }
                />
              </div>
            )}
          </Document>
        </div>

        {/* ========== 底部固定导航栏（仅翻页模式） ========== */}
        {!isScrollMode && numPages > 0 && (
          <div className={cn("flex items-center justify-center gap-4 border-t px-4 py-3 shrink-0", theme.line, theme.bg)}>
            <button
              onClick={prevPage}
              disabled={pageNumber <= 1}
              className={cn("flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
            >
              <BiChevronLeft className="h-4 w-4" />
              上一页
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value, 10) || 1)}
                className={cn("w-14 h-7 text-center text-sm rounded border tabular-nums", theme.inputBg, theme.inputBorder, theme.inputText)}
              />
              <span className={cn("text-sm", theme.text)}>/ {numPages}</span>
            </div>
            
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className={cn("flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-30", theme.text, theme.buttonHover)}
            >
              下一页
              <BiChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 滚动模式底部提示 */}
        {isScrollMode && numPages > 0 && (
          <div className={cn("flex items-center justify-center border-t px-4 py-2 text-xs shrink-0", theme.line, themeMode === 'dark' ? 'text-zinc-500' : 'text-zinc-400')}>
            滚动模式 · 共 {numPages} 页
          </div>
        )}
      </div>
    );
  }
);

PdfReader.displayName = "PdfReader";

export default PdfReader;
export type { PdfReaderProps, PdfReaderRef, PdfThemeMode, ReadingMode } from "./types";
