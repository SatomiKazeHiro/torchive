import { Link } from "react-router-dom";
import {
  BiHome,
  BiArrowBack,
  BiCog,
  BiChevronLeft,
  BiChevronRight,
  BiPlay,
  BiPause,
} from "react-icons/bi";
import { cn } from "@/components/utils/common";
import type { ToolbarProps } from "../types";

export default function Toolbar({
  isVisible,
  mode,
  currentPage,
  totalPages,
  chapterUnits,
  isFirstPage,
  isLastPage,
  isFirstChapter,
  isLastChapter,
  isAutoPlay,
  title,
  chapterName,
  onMouseEnter,
  onMouseLeave,
  onBack,
  onOpenSettings,
  onPrevPage,
  onNextPage,
  onPrevChapter,
  onNextChapter,
  onToggleAutoPlay,
}: ToolbarProps) {
  return (
    <>
      {/* ============ 顶部导航栏 ============ */}
      <div
        className={cn(
          "absolute top-0 right-0 left-0 z-20 transition-transform duration-300",
          isVisible ? "translate-y-0" : "-translate-y-full",
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-zinc-900/90 backdrop-blur-sm">
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
                <span className="font-medium text-white">{title}</span>
                {chapterName !== "本篇" && (
                  <>
                    <span className="text-zinc-600">/</span>
                    <span className="text-zinc-400">{chapterName}</span>
                  </>
                )}
              </div>
            </div>

            {/* 右侧 */}
            <div className="flex items-center gap-4">
              {mode === "single" && (
                <span className="text-xs text-zinc-500">
                  {currentPage} / {totalPages}
                </span>
              )}
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
          "absolute right-0 bottom-0 left-0 z-20 transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full",
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-zinc-900/90 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            {/* 章节切换 */}
            <div className="flex items-center gap-2">
              {chapterUnits.length > 1 && (
                <button
                  onClick={onPrevChapter}
                  disabled={isFirstChapter}
                  className={cn(
                    "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                    isFirstChapter
                      ? "cursor-not-allowed text-zinc-600"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <BiChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">上一话</span>
                </button>
              )}
            </div>

            {/* 页码控制（仅单页模式） */}
            <div className="flex items-center gap-2">
              {mode === "single" && (
                <>
                  <button
                    onClick={onPrevPage}
                    disabled={isFirstPage}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      isFirstPage
                        ? "cursor-not-allowed text-zinc-600"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                    )}
                  >
                    <BiChevronLeft className="h-4 w-4" />
                    上一页
                  </button>

                  <button
                    onClick={onToggleAutoPlay}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      isAutoPlay
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                    )}
                  >
                    {isAutoPlay ? (
                      <>
                        <BiPause className="h-4 w-4" />
                        <span className="hidden sm:inline">暂停</span>
                      </>
                    ) : (
                      <>
                        <BiPlay className="h-4 w-4" />
                        <span className="hidden sm:inline">幻灯片</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onNextPage}
                    disabled={isLastPage}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      isLastPage
                        ? "cursor-not-allowed text-zinc-600"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                    )}
                  >
                    下一页
                    <BiChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* 章节切换 */}
            <div className="flex items-center gap-2">
              {chapterUnits.length > 1 && (
                <button
                  onClick={onNextChapter}
                  disabled={isLastChapter}
                  className={cn(
                    "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                    isLastChapter
                      ? "cursor-not-allowed text-zinc-600"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <span className="hidden sm:inline">下一话</span>
                  <BiChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
