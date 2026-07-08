import { useState } from "react";
import { BiDownload, BiError } from "react-icons/bi";
import type { ViewerProps } from "./types";

/**
 * PDF 查看器组件
 *
 * 功能特性：
 * - 使用 iframe 内嵌预览 PDF
 * - 显示加载状态
 * - 加载失败时提供下载选项
 * - 提供下载按钮
 */
export default function PdfViewer({ src, fileName }: ViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 错误状态
  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 p-8 dark:bg-zinc-950">
        <BiError className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <p className="text-center text-zinc-500">PDF 加载失败</p>
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
    <div className="flex h-full w-full flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* PDF 工具栏 */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="max-w-md truncate text-sm text-zinc-600 dark:text-zinc-400">
          {fileName}
        </span>
        <a
          href={src}
          download
          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
          title="下载"
        >
          <BiDownload className="h-5 w-5" />
        </a>
      </div>

      {/* PDF 渲染区域 */}
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        )}
        <iframe
          src={src}
          className="h-full w-full"
          title={fileName}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
