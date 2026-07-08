import { useRef, useEffect } from "react";
import { cn } from "@/components/utils/common";
import type { SongResult } from "../../Mixture/types";

interface SearchPopperProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  results: SongResult[];
  loadingSongId: number | null;
  selectedSongId: number | null;
  onSelectSong: (songId: number) => void;
  triggerButton: React.ReactNode;
}

/**
 * 歌词搜索 Popper 组件
 */
export function SearchPopper({
  isOpen,
  onClose,
  keyword,
  onKeywordChange,
  onSearch,
  isSearching,
  results,
  loadingSongId,
  selectedSongId,
  onSelectSong,
  triggerButton,
}: SearchPopperProps) {
  const popperRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭 Popper
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popperRef.current && !popperRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={popperRef}>
      {triggerButton}

      {/* Popper 下拉面板 */}
      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-72 rounded-lg border border-zinc-700/50 bg-zinc-900/95 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          {/* 搜索输入框 */}
          <div className="border-b border-zinc-800 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="输入歌曲名或歌手"
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
              />
              <button
                onClick={onSearch}
                disabled={isSearching || !keyword.trim()}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-600 disabled:opacity-40"
              >
                {isSearching ? "..." : "搜索"}
              </button>
            </div>
          </div>

          {/* 搜索结果列表 */}
          <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-light">
            {isSearching ? (
              <div className="flex h-20 items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
                <span className="text-xs text-zinc-400">搜索中...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-0.5">
                {results.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => onSelectSong(song.id)}
                    disabled={loadingSongId !== null}
                    className={cn(
                      "relative w-full rounded-md p-2 text-left transition-colors",
                      selectedSongId === song.id ? "bg-white/20" : "hover:bg-white/10",
                      loadingSongId !== null && loadingSongId !== song.id && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "flex-1 truncate text-xs",
                          selectedSongId === song.id ? "font-medium text-white" : "text-zinc-200"
                        )}
                      >
                        {song.name}
                      </p>
                      {loadingSongId === song.id && (
                        <div className="ml-2 h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-zinc-200" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                      {song.artists.map((a) => a.name).join(", ")} · {song.album?.name}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center text-xs text-zinc-500">
                {keyword.trim() ? "未找到相关歌曲" : "请输入关键词搜索"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
