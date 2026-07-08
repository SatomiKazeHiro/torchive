import { BiFile, BiDownload } from "react-icons/bi";
import type { ViewerProps } from "./types";

/**
 * 文件下载组件
 *
 * 用于不支持预览的文件类型，提供下载选项。
 *
 * 使用场景：
 * - 未知文件类型
 * - 压缩包、可执行文件等无法预览的格式
 */
export default function Download({ src, fileName }: ViewerProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 p-8 dark:bg-zinc-950">
      <BiFile className="h-16 w-16 text-zinc-200 dark:text-zinc-800" />
      <p className="text-center text-zinc-500">暂不支持预览此类型文件</p>
      <p className="max-w-md truncate text-sm text-zinc-400">{fileName}</p>
      <a
        href={src}
        download
        className="mt-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        <span className="flex items-center gap-2">
          <BiDownload className="h-4 w-4" />
          下载文件
        </span>
      </a>
    </div>
  );
}
