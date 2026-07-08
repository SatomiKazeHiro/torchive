import { cn } from "@/components/utils/common";
import { getLyricTextSize, getLyricTransSize } from "../utils";
import type { LyricLine } from "../types";

interface LyricLineComponentProps {
  line: LyricLine;
  isActive: boolean;
  onClick: () => void;
  hasCover: boolean;
  fontSize: "small" | "medium" | "large";
  lyricMode: "both" | "original" | "translation";
}

/**
 * 歌词行组件
 */
export function LyricLineComponent({
  line,
  isActive,
  onClick,
  hasCover,
  fontSize,
  lyricMode,
}: LyricLineComponentProps) {
  // 根据模式决定是否显示
  const showOriginal = lyricMode === "both" || lyricMode === "original";
  const showTranslation = (lyricMode === "both" || lyricMode === "translation") && line.translation;

  if (lyricMode === "translation" && !line.translation) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer py-3 text-center transition-all duration-300",
        isActive
          ? hasCover
            ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            : "text-zinc-100"
          : hasCover
            ? "text-white/50 hover:text-white/80"
            : "text-zinc-500 hover:text-zinc-400"
      )}
    >
      {showOriginal && (
        <p
          className={cn(
            "leading-relaxed transition-all duration-300",
            getLyricTextSize(fontSize, isActive),
            isActive && "font-medium"
          )}
        >
          {line.text}
        </p>
      )}
      {showTranslation && (
        <p
          className={cn(
            "leading-relaxed transition-all duration-300",
            getLyricTransSize(fontSize),
            isActive ? "mt-1.5 opacity-80" : "mt-1 opacity-50"
          )}
        >
          {line.translation}
        </p>
      )}
    </div>
  );
}
