import { BiPlay, BiPause } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { getBaseName } from "@/utils/fileHelper";
import type { PlaylistItem } from "../types";
import InPlaying from "@/features/common/InPlaying";

interface PlaylistItemProps {
  item: PlaylistItem;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  index: number;
}

/**
 * 播放列表项组件 - 柔和简约风格
 */
export function PlaylistItemCard({ item, isActive, isPlaying, onClick, index }: PlaylistItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-200",
        isActive ? "bg-zinc-800/60" : "hover:bg-zinc-800/30",
      )}
    >
      {/* 序号/播放图标 */}
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {isActive && isPlaying ? (
          <InPlaying />
        ) : isActive ? (
          <BiPlay className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <span className="text-[11px] font-medium text-zinc-600 tabular-nums group-hover:text-zinc-500">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* 文件名 */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] transition-colors duration-200",
            isActive ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-300",
          )}
        >
          {getBaseName(item.fileName)}
        </p>
        <p className="truncate text-[11px] text-zinc-600">{item.section}</p>
      </div>

      {/* 播放状态指示 */}
      <div className="shrink-0">
        {isActive && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700/50 text-zinc-300">
            {isPlaying ? <BiPause className="h-3 w-3" /> : <BiPlay className="ml-0.5 h-3 w-3" />}
          </div>
        )}
      </div>
    </button>
  );
}
