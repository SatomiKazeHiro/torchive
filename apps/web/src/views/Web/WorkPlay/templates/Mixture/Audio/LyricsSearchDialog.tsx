import type { SongResult } from "../types";

/**
 * 歌词搜索弹窗组件 Props
 */
interface LyricsSearchDialogProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 搜索关键词 */
  searchKeyword: string;
  /** 关键词变化回调 */
  onKeywordChange: (keyword: string) => void;
  /** 提交搜索回调 */
  onSubmit: (e: React.FormEvent) => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 搜索结果列表 */
  searchResults: SongResult[];
  /** 选择歌曲回调 */
  onSelectSong: (songId: number) => void;
}

/**
 * 歌词搜索弹窗组件
 * 
 * 用于从网易云音乐搜索歌词并选择匹配的歌曲
 */
export function LyricsSearchDialog({
  isOpen,
  searchKeyword,
  onKeywordChange,
  onSubmit,
  onClose,
  isSearching,
  searchResults,
  onSelectSong,
}: LyricsSearchDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">搜索歌曲</span>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </div>
          <form onSubmit={onSubmit} className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                placeholder="输入歌曲名或歌手"
                className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              />
              <button
                type="submit"
                disabled={isSearching || !searchKeyword.trim()}
                className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSearching ? "搜索中" : "搜索"}
              </button>
            </div>
          </form>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {isSearching ? (
            <div className="flex h-28 items-center justify-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border border-zinc-200 border-t-zinc-600" />
              <span className="text-sm text-zinc-400">搜索中...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-0.5">
              {searchResults.map((song) => (
                <button
                  key={song.id}
                  onClick={() => onSelectSong(song.id)}
                  className="w-full rounded-md p-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{song.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {song.artists.map(a => a.name).join(', ')} · {song.album?.name}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center text-sm text-zinc-400">
              {searchKeyword.trim() ? "未找到相关歌曲" : "请输入关键词搜索"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
