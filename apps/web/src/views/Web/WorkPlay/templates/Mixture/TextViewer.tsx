import { BiDownload, BiError } from "react-icons/bi";
import type { ViewerProps } from "./types";
import { useTextViewer } from "./hooks";

// 每行高度，与 Hook 中保持一致
const ITEM_HEIGHT = 28;

/**
 * 文本查看器组件
 *
 * 功能特性：
 * - 流式加载大文本文件（分块读取，避免内存压力）
 * - 虚拟滚动渲染（只渲染可视区域，支持超大文件）
 * - 显示加载状态和段落统计
 *
 * 技术实现：
 * - 使用 useTextViewer Hook 管理加载和虚拟滚动逻辑
 * - 使用 ResizeObserver 监听容器大小变化
 * - 使用 ahooks useUnmount 清理资源
 */
export default function TextViewer({ src, fileName }: ViewerProps) {
  const { paragraphs, isLoading, isStreaming, hasError, containerRef, handleScroll, virtualList } =
    useTextViewer({ src });

  // 错误状态
  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 p-8 dark:bg-zinc-950">
        <BiError className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <p className="text-center text-zinc-500">文本加载失败</p>
        <p className="max-w-md truncate text-sm text-zinc-400">{fileName}</p>
        <a
          href={src}
          download
          className="mt-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
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
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-950">
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="max-w-md truncate text-sm text-zinc-600 dark:text-zinc-400">
            {fileName}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
              加载中...
            </span>
          )}
        </div>
        <a
          href={src}
          download
          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
          title="下载"
        >
          <BiDownload className="h-5 w-5" />
        </a>
      </div>

      {/* 虚拟滚动文本区域 */}
      <div ref={containerRef} className="flex-1 overflow-auto" onScroll={handleScroll}>
        {isLoading && paragraphs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        ) : (
          <div className="relative" style={{ height: virtualList.totalHeight }}>
            <div
              className="absolute right-0 left-0"
              style={{ transform: `translateY(${virtualList.offsetY}px)` }}
            >
              {virtualList.visibleParagraphs.map((para) => (
                <p
                  key={para.id}
                  className="truncate px-4 font-mono text-sm leading-7 text-zinc-700 dark:text-zinc-300"
                  style={{ height: ITEM_HEIGHT }}
                  title={para.content}
                >
                  {para.content}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {!isLoading && paragraphs.length > 0 && (
        <div className="border-t border-zinc-200 px-4 py-1 text-xs text-zinc-400 dark:border-zinc-800">
          共 {paragraphs.length} 段
        </div>
      )}
    </div>
  );
}
