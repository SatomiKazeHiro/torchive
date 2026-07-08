import { BiX } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { READER_OVERLAY_PALETTE } from "@/features/common/readerThemes";
import type { SettingsPanelProps, ThemeMode, FontSize, ReadingMode } from "../types";

// 主题选项配置
const THEME_OPTIONS: { value: ThemeMode; label: string; color: string; desc: string }[] = [
  {
    value: "parchment",
    label: "羊皮纸",
    color: READER_OVERLAY_PALETTE.parchment.bg,
    desc: "温暖黄棕"
  },
  {
    value: "dark",
    label: "夜间",
    color: READER_OVERLAY_PALETTE.dark.bg,
    desc: "深色调"
  },
];

// 阅读模式选项
const READING_MODE_OPTIONS: { value: ReadingMode; label: string; desc: string }[] = [
  { value: "page", label: "翻页", desc: "逐页切换" },
  { value: "scroll", label: "滚动", desc: "连续滚动" },
];

export default function SettingsPanel({
  isOpen,
  onClose,
  themeMode,
  fontSize,
  readingMode,
  currentChapterIndex,
  chapterUnits,
  fileExtension,
  onThemeChange,
  onFontSizeChange,
  onReadingModeChange,
  onChapterSelect,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: "small", label: "小" },
    { value: "medium", label: "中" },
    { value: "large", label: "大" },
    { value: "xlarge", label: "特大" },
  ];

  // 阅读模式仅 PDF 阅读器生效
  const showReadingMode = fileExtension === "pdf";

  return (
    <div className="absolute inset-0 z-[60] flex items-end justify-center sm:items-center">
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
          {/* 主题模式 */}
          <div className="space-y-3">
            <label className="text-sm text-zinc-400">阅读主题</label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, color, desc }) => (
                <button
                  key={value}
                  onClick={() => onThemeChange(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                    themeMode === value
                      ? "border-zinc-400 bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  )}
                >
                  {/* 颜色预览 */}
                  <div className={cn("h-10 w-full rounded-md border border-zinc-600/30", color)} />
                  <div className="text-center">
                    <span className="block text-sm">{label}</span>
                    <span className="text-[10px] text-zinc-500">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div className="space-y-3">
            <label className="text-sm text-zinc-400">字体大小</label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {fontSizeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFontSizeChange(value)}
                  className={cn(
                    "flex items-center justify-center rounded-lg border py-3 text-sm transition-all",
                    fontSize === value
                      ? "border-zinc-400 bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  )}
                >
                  <span
                    className={cn(
                      "mr-1 transition-all",
                      value === "small" && "text-xs",
                      value === "medium" && "text-sm",
                      value === "large" && "text-base",
                      value === "xlarge" && "text-lg"
                    )}
                  >
                    A
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 阅读模式（仅 PDF 生效） */}
          {showReadingMode && (
            <div className="space-y-3">
              <label className="text-sm text-zinc-400">阅读模式</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {READING_MODE_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => onReadingModeChange(value)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border py-2.5 text-sm transition-all",
                      readingMode === value
                        ? "border-zinc-400 bg-zinc-800 text-white"
                        : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    )}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] text-zinc-500">{desc}</span>
                  </button>
                ))}
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
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{unit.name}</span>
                      <span className="text-xs text-zinc-600">{unit.files.length}章</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 快捷键提示 */}
          <div className="space-y-3 rounded-lg bg-zinc-950/50 p-3">
            <label className="text-xs text-zinc-500">快捷键</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">↑</kbd>
                  <span className="text-zinc-500">/</span>
                  <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">↓</kbd>
                </div>
                <span className="text-xs text-zinc-400">滚动</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/50 px-3 py-2">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">T</kbd>
                <span className="text-xs text-zinc-400">切换主题</span>
              </div>
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
