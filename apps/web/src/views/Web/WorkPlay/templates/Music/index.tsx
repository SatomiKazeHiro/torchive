import { Link } from "react-router-dom";
import {
  BiPlay,
  BiPause,
  BiSkipPrevious,
  BiSkipNext,
  BiListUl,
  BiText,
  BiVolumeFull,
  BiVolumeMute,
  BiRepeat,
  BiShuffle,
  BiLeftArrowAlt,
  BiFontSize,
  BiSearch,
  BiDisc,
  BiCloud,
} from "react-icons/bi";
import { Button, Card } from "@/components";
import { cn } from "@/components/utils/common";
import { formatTime } from "@/utils/format";
import { getBaseName } from "@/utils/fileHelper";
import { useMusicPlayer } from "./hooks";
import { PlaylistItemCard } from "./components/PlaylistItem";
import { LyricLineComponent } from "./components/LyricLine";
import { SearchPopper } from "./components/SearchPopper";
import { getLayoutIconName, getLayoutLabel } from "./utils";
import type { MusicPlayTemplateProps } from "./types";
import "./style.css";

/**
 * 音乐播放模板 - 主组件
 *
 * 功能特性：
 * - 左右/右左可切换布局
 * - 歌单列表 + 歌词显示
 * - 封面颜色提取作为背景
 * - 网易云音乐歌词搜索
 */
export default function MusicPlayTemplate({
  transformedWorkData,
  domain,
  category,
  loading,
  error,
  onRetry,
  initialFilePath,
}: MusicPlayTemplateProps) {
  const {
    // 播放列表
    playlist,
    currentIndex,
    currentItem,
    playAtIndex,
    hasPrev,
    hasNext,
    workTitle,

    // 播放控制
    isPlaying,
    currentTime,
    duration,
    progress,
    audioRef,
    togglePlay,
    handleSeek,
    handlePrev,
    handleNext,

    // 播放器状态
    repeatMode,
    setRepeatMode,
    isShuffle,
    setIsShuffle,
    volume,
    setVolume,
    isMuted,
    setIsMuted,

    // 歌词
    lyrics,
    currentLyricIndex,
    isLoadingLyric,
    lyricStatus,
    lyricContainerRef,
    activeLyricRef,
    lyricSource,
    lyricFontSize,
    lyricMode,
    cycleFontSize,
    cycleLyricMode,

    // 搜索
    showSearchPopper,
    setShowSearchPopper,
    localSearchKeyword,
    setLocalSearchKeyword,
    localSearchResults,
    localIsSearching,
    loadingSongId,
    selectedSongId,
    handleOpenSearch,
    handleManualSearch,
    handleSelectSong,

    // 布局和样式
    layoutMode,
    cycleLayout,
    isPlaylistFirst,
    backgroundStyle,
    effectiveCoverUrl,
  } = useMusicPlayer({ transformedWorkData, initialFilePath });

  // 加载/错误状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !transformedWorkData || playlist.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-6">
        <Card className="w-full max-w-sm py-12 text-center" bordered={false} shadow="sm">
          <BiListUl className="mx-auto mb-4 h-12 w-12 text-zinc-800" />
          <p className="mb-6 text-sm text-zinc-500">{error || "暂无音频内容"}</p>
          <Button variant="primary" onClick={onRetry}>
            重试
          </Button>
        </Card>
      </div>
    );
  }

  const workId = transformedWorkData.work.hash_id;

  // 歌单面板
  const playlistPanel = (
    <div key="playlist" className="flex h-full w-80 flex-col overflow-hidden border-r border-zinc-800/50 bg-zinc-950">
      {/* 歌单头部 */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <BiListUl className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400">播放列表</h3>
          <span className="rounded-full bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
            {playlist.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRepeatMode((m) => (m === "none" ? "all" : m === "all" ? "one" : "none"))}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              repeatMode !== "none"
                ? "bg-zinc-800/50 text-zinc-400"
                : "text-zinc-600 hover:bg-zinc-800/30 hover:text-zinc-400"
            )}
            title={repeatMode === "one" ? "单曲循环" : repeatMode === "all" ? "列表循环" : "顺序播放"}
          >
            <BiRepeat className="h-3.5 w-3.5" />
            {repeatMode === "one" && (
              <span className="absolute bottom-1 right-1 text-[6px] font-bold">1</span>
            )}
          </button>
          <button
            onClick={() => setIsShuffle((v) => !v)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              isShuffle ? "bg-zinc-800/50 text-zinc-400" : "text-zinc-600 hover:bg-zinc-800/30 hover:text-zinc-400"
            )}
            title={isShuffle ? "随机播放" : "顺序播放"}
          >
            <BiShuffle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 歌单列表 */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-light">
        {playlist.map((item, idx) => (
          <PlaylistItemCard
            key={item.id}
            item={item}
            index={idx}
            isActive={idx === currentIndex}
            isPlaying={isPlaying}
            onClick={() => playAtIndex(idx)}
          />
        ))}
      </div>
    </div>
  );

  // 歌词面板
  const lyricsPanel = (
    <div key="lyrics" className="flex flex-1 flex-col overflow-hidden" style={backgroundStyle}>
      {/* 歌词头部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/${domain}/${category}/${workId}`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
          >
            <BiLeftArrowAlt className="h-4 w-4" />
          </Link>
          <div className="ml-1">
            <h2 className="max-w-[200px] truncate text-sm font-medium text-white">
              {currentItem ? getBaseName(currentItem.fileName) : "未播放"}
            </h2>
            <p className="text-[11px] text-white/60">{workTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 歌词来源指示 */}
          {lyricSource !== "none" && (
            <div
              className="flex h-7 items-center gap-1.5 rounded-full bg-black/20 px-2.5 text-[11px] text-white/80 backdrop-blur-sm"
              title={lyricSource === "embedded" ? "音频文件内嵌歌词" : "网络搜索歌词"}
            >
              {lyricSource === "embedded" ? (
                <>
                  <BiDisc className="h-3 w-3" />
                  <span>内嵌</span>
                </>
              ) : (
                <>
                  <BiCloud className="h-3 w-3" />
                  <span>网络</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={cycleLayout}
            className="flex h-7 items-center gap-1.5 rounded-full bg-black/20 px-3 text-[11px] text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
          >
            {getLayoutIconName(layoutMode) === "list" ? (
              <BiListUl className="h-4 w-4" />
            ) : (
              <BiText className="h-4 w-4" />
            )}
            <span>{getLayoutLabel(layoutMode)}</span>
          </button>
        </div>
      </div>

      {/* 歌词内容区 */}
      <div
        ref={lyricContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 scrollbar-light"
      >
        <div style={{ paddingTop: "33vh", paddingBottom: "33vh" }}>
          {lyrics.length > 0 ? (
            lyrics.map((line, index) => (
              <div
                key={index}
                ref={index === currentLyricIndex ? activeLyricRef : null}
                onClick={() => {
                  if (audioRef.current && isFinite(line.time)) {
                    audioRef.current.currentTime = line.time;
                  }
                }}
              >
                <LyricLineComponent
                  line={line}
                  isActive={index === currentLyricIndex}
                  onClick={() => {
                    if (audioRef.current && isFinite(line.time)) {
                      audioRef.current.currentTime = line.time;
                    }
                  }}
                  hasCover={!!effectiveCoverUrl}
                  fontSize={lyricFontSize}
                  lyricMode={lyricMode}
                />
              </div>
            ))
          ) : isLoadingLyric ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-white/70">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm">正在获取歌词...</span>
              </div>
            </div>
          ) : lyricStatus === "pure_music" ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-white/70">
              <BiText className="h-12 w-12 opacity-50" />
              <span className="text-sm">纯音乐，请欣赏</span>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-white/50">
              <BiText className="h-12 w-12 opacity-50" />
              <span className="text-sm">暂无歌词</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部播放控制栏 */}
      <div className="border-t border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
        {/* 进度条 */}
        <div className="mb-3">
          <div
            className="group relative h-1 w-full cursor-pointer rounded-full bg-white/20"
            onClick={(e) => handleSeek(e, e.currentTarget.clientWidth)}
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `calc(${Math.max(0, Math.min(100, progress))}% - 6px)` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          {/* 音量控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted((v) => !v)}
              className="text-white/60 transition-colors hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <BiVolumeMute className="h-4 w-4" />
              ) : (
                <BiVolumeFull className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0) setIsMuted(false);
              }}
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20 accent-white volume-slider"
              style={{
                background: `linear-gradient(
                  to right,
                  rgba(255, 255, 255, 0.64) 0%,
                  rgba(255, 255, 255, 0.64) ${volume * 100}%,
                  rgba(255, 255, 255, 0.2) ${volume * 100}%,
                  rgba(255, 255, 255, 0.2) 100%
                )`
              }}
            />
          </div>

          {/* 播放控制 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={!hasPrev && repeatMode !== "all"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <BiSkipPrevious className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-900 transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95"
            >
              {isPlaying ? <BiPause className="h-5 w-5" /> : <BiPlay className="ml-0.5 h-5 w-5" />}
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext && repeatMode !== "all"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <BiSkipNext className="h-5 w-5" />
            </button>
          </div>

          {/* 右侧控制 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={cycleFontSize}
              className="flex h-7 items-center gap-1 rounded-full bg-black/20 px-2.5 text-[11px] text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
              title="调整歌词大小"
            >
              <BiFontSize className="h-3.5 w-3.5" />
              <span>{lyricFontSize === "small" ? "小" : lyricFontSize === "medium" ? "中" : "大"}</span>
            </button>
            <button
              onClick={cycleLyricMode}
              className="flex h-7 items-center gap-1 rounded-full bg-black/20 px-2.5 text-[11px] text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
              title="切换歌词显示模式"
            >
              <BiText className="h-3.5 w-3.5" />
              <span>{lyricMode === "both" ? "双语" : lyricMode === "original" ? "原文" : "翻译"}</span>
            </button>
            <SearchPopper
              isOpen={showSearchPopper}
              onClose={() => setShowSearchPopper(false)}
              keyword={localSearchKeyword}
              onKeywordChange={setLocalSearchKeyword}
              onSearch={handleManualSearch}
              isSearching={localIsSearching}
              results={localSearchResults}
              loadingSongId={loadingSongId}
              selectedSongId={selectedSongId}
              onSelectSong={handleSelectSong}
              triggerButton={
                <button
                  onClick={() => (showSearchPopper ? setShowSearchPopper(false) : handleOpenSearch())}
                  disabled={isLoadingLyric}
                  className={cn(
                    "flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] backdrop-blur-sm transition-colors",
                    showSearchPopper
                      ? "bg-white/30 text-white"
                      : "bg-black/20 text-white/80 hover:bg-black/30 hover:text-white",
                    "disabled:opacity-50"
                  )}
                  title="寻找歌词"
                >
                  <BiSearch className="h-3.5 w-3.5" />
                  <span>找歌词</span>
                </button>
              }
            />
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">
      {isPlaylistFirst ? (
        <>
          {playlistPanel}
          {lyricsPanel}
        </>
      ) : (
        <>
          {lyricsPanel}
          {playlistPanel}
        </>
      )}
      {/* 音频元素放在最外层，避免布局切换时被重新挂载 */}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </div>
  );
}
