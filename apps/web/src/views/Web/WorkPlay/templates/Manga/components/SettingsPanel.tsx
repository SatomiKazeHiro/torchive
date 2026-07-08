import { Slider } from "@/components";
import { BiX, BiBook, BiBookOpen } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import type { SettingsPanelProps } from "../types";

export default function SettingsPanel({
  isOpen,
  onClose,
  mode,
  isAutoPlay,
  autoPlayInterval,
  currentChapterIndex,
  chapterUnits,
  onModeChange,
  onIntervalChange,
  onChapterSelect,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center sm:items-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 面板 */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-zinc-900 p-6 shadow-2xl sm:rounded-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <BiX className="h-5 w-5" />
        </button>

        {/* 标题 */}
        <h3 className="mb-6 text-lg font-medium text-white">阅读设置</h3>

        {/* 内容 */}
        <div className="space-y-6">
          {/* 阅读模式 */}
          <div className="space-y-3">
            <label className="text-sm text-zinc-400">阅读模式</label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => onModeChange("single")}
                disabled={isAutoPlay}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                  mode === "single"
                    ? "border-zinc-500 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                  isAutoPlay && "cursor-not-allowed opacity-50",
                )}
              >
                <BiBook className="h-6 w-6" />
                <span className="text-sm">单页模式</span>
                <span className="text-xs text-zinc-600">左右翻页</span>
              </button>
              <button
                onClick={() => onModeChange("strip")}
                disabled={isAutoPlay}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                  mode === "strip"
                    ? "border-zinc-500 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                  isAutoPlay && "cursor-not-allowed opacity-50",
                )}
              >
                <BiBookOpen className="h-6 w-6" />
                <span className="text-sm">条漫模式</span>
                <span className="text-xs text-zinc-600">上下滚动</span>
              </button>
            </div>
          </div>

          {/* 自动播放间隔 */}
          {mode === "single" && (
            <div className="space-y-3">
              <label className="text-sm text-zinc-400">
                自动播放间隔: <span className="text-zinc-200">{autoPlayInterval}秒</span>
              </label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={autoPlayInterval}
                onChange={onIntervalChange}
                tipFormatter={(v) => `${v}秒`}
                className="mt-3"
                trackClassName="bg-zinc-800"
                progressClassName="bg-zinc-500"
                thumbClassName="bg-zinc-400 border-2 border-zinc-500"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>1秒</span>
                <span>10秒</span>
              </div>
            </div>
          )}

          {/* 章节选择 */}
          {chapterUnits.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm text-zinc-400">章节选择</label>
              <div
                className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800 p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgb(63 63 70) transparent",
                }}
              >
                {chapterUnits.map((unit, index) => (
                  <button
                    key={unit.key}
                    onClick={() => onChapterSelect(index)}
                    className={cn(
                      "w-full rounded px-3 py-2 text-left text-sm transition-colors",
                      currentChapterIndex === index
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{unit.name}</span>
                      <span className="text-xs text-zinc-600">{unit.files.length}P</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 快捷键提示 - 优化布局 */}
          <div className="space-y-3 rounded-lg bg-zinc-950/50 p-3">
            <label className="text-xs text-zinc-500">快捷键</label>
            <div className="space-y-2">
              {/* 单页模式快捷键 */}
              {mode === "single" && (
                <>
                  <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">←</kbd>
                      <span className="text-zinc-500">/</span>
                      <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">→</kbd>
                    </div>
                    <span className="text-xs text-zinc-400">翻页</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      Space
                    </kbd>
                    <span className="text-xs text-zinc-400">播放/暂停</span>
                  </div>
                </>
              )}
              {/* 条漫模式快捷键 */}
              {mode === "strip" && (
                <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">↑</kbd>
                    <span className="text-zinc-500">/</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">↓</kbd>
                  </div>
                  <span className="text-xs text-zinc-400">滚动</span>
                </div>
              )}
              {/* 通用快捷键 */}
              <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">ESC</kbd>
                <span className="text-xs text-zinc-400">关闭设置</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
