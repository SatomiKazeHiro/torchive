import { useState, useCallback } from "react";
import {
  BiPlay,
  BiPause,
  BiRadio,
  BiText,
  BiSkipPrevious,
  BiSkipNext,
  BiChevronLeft,
} from "react-icons/bi";
import type { AudioPlayerProps, LyricLine } from "../types";
import { formatTime } from "@/utils/format";
import { useAudioPlayer, useAudioMetadata, useCoverColor, useLyrics } from "./hooks";

import { SwitchableCover, SimpleCover } from "./Cover";
import { Waveform } from "./Waveform";
import { LyricsSearchDialog } from "./LyricsSearchDialog";

/**
 * 音频播放器主组件
 *
 * 功能特性：
 * - 标准模式：黑胶唱片/方形封面切换、播放控制
 * - 歌词模式：全屏歌词显示、自动滚动、点击跳转
 * - 波形图模式：可视化波形、点击跳转
 * - 智能歌词搜索：优先内嵌歌词，自动搜索网易云音乐
 * - 动态背景：根据封面提取主色调作为歌词背景
 *
 * 架构说明：
 * - 所有业务逻辑已解耦到自定义 Hooks 中
 * - useAudioPlayer: 播放控制
 * - useAudioMetadata: 元数据解析
 * - useCoverColor: 封面颜色提取
 * - useLyrics: 歌词管理（独立文件）
 *
 * @param props - AudioPlayerProps
 */
export default function AudioPlayer({
  src,
  fileName,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: AudioPlayerProps) {
  // ===== 播放器 UI 状态 =====
  /** 是否使用波形图模式 */
  const [useWaveform, setUseWaveform] = useState(false);
  /** 是否显示黑胶唱片 */
  const [showVinyl, setShowVinyl] = useState(true);

  // ===== 自定义 Hooks =====

  // 解析音频元数据（封面、内嵌歌词等）
  const { coverUrl, parsedLyrics } = useAudioMetadata(src);

  // 提取封面主色调作为歌词背景（无封面时默认白色）
  const { dominantColor, secondaryColor } = useCoverColor(coverUrl);

  // 音频播放控制
  const { isPlaying, currentTime, duration, audioRef, togglePlay, handleSeek } = useAudioPlayer({
    src,
  });

  // 歌词管理（已解耦到独立 Hook）
  const {
    showLyricPanel,
    setShowLyricPanel,
    showSearchDialog,
    setShowSearchDialog,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    lyrics,
    currentLyricIndex,
    isSearching,
    isLoadingLyric,
    lyricMode,
    setLyricMode,
    lyricFontSize,
    setLyricFontSize,
    lyricStatus,
    lyricContainerRef,
    activeLyricRef,
    searchAndAutoSelect,
    openSearchDialog,
    handleSearch,
    selectSong,
  } = useLyrics({ fileName, currentTime, duration, embeddedLyrics: parsedLyrics });

  // ===== 派生状态 & 工具函数 =====

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 缓存波形图跳转回调，防止 Waveform 组件重复创建
  const handleWaveformSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    },
    [audioRef],
  );

  // 歌词显示工具函数
  const getModeLabel = (m: typeof lyricMode) =>
    ({ both: "双语", original: "原文", translation: "翻译" })[m];
  const getSizeLabel = (s: typeof lyricFontSize) => ({ small: "小", medium: "中", large: "大" })[s];
  const getLineText = (line: LyricLine) =>
    lyricMode === "translation" ? line.translation || "" : line.text;
  const shouldShowTrans = (line: LyricLine) => lyricMode === "both" && !!line.translation;
  const shouldShowLine = (line: LyricLine) => lyricMode !== "translation" || !!line.translation;

  // 样式类
  const iconBtnClass =
    "flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";
  const navBtnClass =
    "flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

  // 歌词字体大小类
  const getLyricSizeClass = (isActive: boolean) => {
    if (isActive) {
      return {
        small: "text-xl font-bold",
        medium: "text-2xl font-bold",
        large: "text-3xl font-bold",
      }[lyricFontSize];
    }
    return {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    }[lyricFontSize];
  };

  const getTransSizeClass = (isActive: boolean, hasCover: boolean) => {
    if (hasCover) {
      return {
        small: `text-sm ${isActive ? "font-semibold opacity-95" : "opacity-60"}`,
        medium: `text-base ${isActive ? "font-semibold opacity-95" : "opacity-60"}`,
        large: `text-lg ${isActive ? "font-semibold opacity-95" : "opacity-60"}`,
      }[lyricFontSize];
    } else {
      if (isActive) {
        return {
          small: "text-sm font-medium text-zinc-700 dark:text-zinc-300",
          medium: "text-base font-medium text-zinc-700 dark:text-zinc-300",
          large: "text-lg font-medium text-zinc-700 dark:text-zinc-300",
        }[lyricFontSize];
      }
      return {
        small: "text-xs text-zinc-400 dark:text-zinc-500",
        medium: "text-sm text-zinc-400 dark:text-zinc-500",
        large: "text-base text-zinc-400 dark:text-zinc-500",
      }[lyricFontSize];
    }
  };

  // ===== 渲染 =====

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-950">
      <audio ref={audioRef} preload="metadata" />

      {showLyricPanel ? (
        // ========== 歌词模式 ==========
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* 歌词区域 */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${dominantColor} 0%, ${secondaryColor} 100%)`,
            }}
          >
            {/* 左上角返回 */}
            <button
              title="返回"
              onClick={() => setShowLyricPanel(false)}
              className="absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400"
            >
              <BiChevronLeft />
            </button>

            {/* 右上角寻找歌词 */}
            <button
              onClick={openSearchDialog}
              disabled={isLoadingLyric}
              className="absolute top-3 right-4 z-10 flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-2 py-1 text-[10px] text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400"
            >
              <BiText className="h-3 w-3" />
              寻找歌词
            </button>

            {/* 右下角控制按钮 */}
            {lyrics.length > 0 && (
              <div className="absolute right-4 bottom-3 z-10 flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setLyricFontSize((s) =>
                      s === "small" ? "medium" : s === "medium" ? "large" : "small",
                    )
                  }
                  className="rounded-full border border-zinc-200 bg-white/90 px-2 py-1 text-[10px] text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400"
                >
                  {getSizeLabel(lyricFontSize)}
                </button>
                <button
                  onClick={() =>
                    setLyricMode((m) =>
                      m === "both" ? "original" : m === "original" ? "translation" : "both",
                    )
                  }
                  className="rounded-full border border-zinc-200 bg-white/90 px-2 py-1 text-[10px] text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400"
                >
                  {getModeLabel(lyricMode)}
                </button>
              </div>
            )}

            {/* 歌词列表 */}
            <div
              ref={lyricContainerRef}
              className={`h-full overflow-y-auto px-4 py-6 ${coverUrl ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent" : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-track]:bg-transparent"}`}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: coverUrl
                  ? "rgba(255,255,255,0.3) transparent"
                  : "rgba(0,0,0,0.2) transparent",
              }}
            >
              {lyrics.length > 0 ? (
                <div className="space-y-6" style={{ paddingTop: "45%", paddingBottom: "45%" }}>
                  {lyrics.map((line, index) => {
                    if (!shouldShowLine(line)) return null;
                    const isActive = index === currentLyricIndex;
                    return (
                      <div
                        key={index}
                        ref={isActive ? activeLyricRef : null}
                        data-lyric-index={index}
                        onClick={() => {
                          if (audioRef.current && isFinite(line.time)) {
                            audioRef.current.currentTime = line.time;
                          }
                        }}
                        className={`cursor-pointer text-center transition-all duration-200 ${coverUrl ? (isActive ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" : "text-white/60 hover:text-white/90") : isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
                      >
                        <p className={`leading-relaxed ${getLyricSizeClass(isActive)}`}>
                          {getLineText(line)}
                        </p>
                        {shouldShowTrans(line) && (
                          <p
                            className={`mt-1.5 leading-relaxed ${getTransSizeClass(isActive, !!coverUrl)}`}
                          >
                            {line.translation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : isLoadingLyric ? (
                <div
                  className={`flex h-full items-center justify-center text-sm ${coverUrl ? "text-white/80" : "text-zinc-400"}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    正在获取歌词...
                  </div>
                </div>
              ) : lyricStatus === "pure_music" ? (
                <div
                  className={`flex h-full flex-col items-center justify-center gap-2 ${coverUrl ? "text-white/70" : "text-zinc-400"}`}
                >
                  <span className="text-sm">纯音乐，请欣赏</span>
                </div>
              ) : lyricStatus === "not_collected" ? (
                <div
                  className={`flex h-full items-center justify-center text-sm ${coverUrl ? "text-white/80" : "text-zinc-400"}`}
                >
                  暂无歌词收录，可尝试点击右上角"寻找歌词"手动搜索
                </div>
              ) : (
                <div
                  className={`flex h-full items-center justify-center text-sm ${coverUrl ? "text-white/80" : "text-zinc-400"}`}
                >
                  暂无歌词，点击右上角"寻找歌词"按钮搜索
                </div>
              )}
            </div>
          </div>

          {/* 底部控制栏 */}
          <div className="border-t border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <SimpleCover
                isPlaying={isPlaying}
                size="sm"
                imageUrl={coverUrl}
                onClick={() => setShowVinyl(!showVinyl)}
              />

              {/* 进度条/波形 */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-300">{fileName}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-400 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  {useWaveform ? (
                    <div className="h-5 flex-1">
                      <Waveform
                        src={src}
                        currentTime={currentTime}
                        duration={duration}
                        height={20}
                        onSeek={handleWaveformSeek}
                      />
                    </div>
                  ) : (
                    <div
                      className="group relative flex h-5 flex-1 items-center"
                      onClick={(e) => handleSeek(e, e.currentTarget.clientWidth)}
                    >
                      <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200"
                          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <span className="text-[9px] text-zinc-400 tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => setUseWaveform(!useWaveform)}
                  className={iconBtnClass}
                  title={useWaveform ? "标准模式" : "波形模式"}
                >
                  <BiRadio className="h-3.5 w-3.5" />
                </button>
                <div className="mx-0.5 h-3 w-px bg-zinc-200 dark:bg-zinc-700" />
                <button onClick={onPrev} disabled={!hasPrev} className={navBtnClass} title="上一首">
                  <BiSkipPrevious className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isPlaying ? (
                    <BiPause className="h-3.5 w-3.5" />
                  ) : (
                    <BiPlay className="h-3.5 w-3.5" style={{ marginLeft: "1px" }} />
                  )}
                </button>
                <button onClick={onNext} disabled={!hasNext} className={navBtnClass} title="下一首">
                  <BiSkipNext className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ========== 标准模式 ==========
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
          {/* 顶部按钮 */}
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <button
              onClick={() => setUseWaveform(!useWaveform)}
              className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <BiRadio className="h-3 w-3" />
              {useWaveform ? "标准" : "波形"}
            </button>
            <button
              onClick={searchAndAutoSelect}
              disabled={isLoadingLyric}
              className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <BiText className="h-3 w-3" />
              歌词
            </button>
          </div>

          {/* 封面 */}
          <SwitchableCover
            isPlaying={isPlaying}
            size="lg"
            showVinyl={showVinyl}
            onToggle={() => setShowVinyl(!showVinyl)}
            imageUrl={coverUrl}
          />

          {/* 文件名 */}
          <div className="text-center">
            <p className="max-w-xs truncate text-sm text-zinc-900 dark:text-zinc-100">{fileName}</p>
          </div>

          {/* 波形 */}
          {useWaveform && (
            <div className="w-full max-w-xs">
              <Waveform
                src={src}
                currentTime={currentTime}
                duration={duration}
                height={40}
                onSeek={handleWaveformSeek}
              />
            </div>
          )}

          {/* 控制区 */}
          <div className="w-full max-w-xs space-y-4">
            {!useWaveform && (
              <div
                className="group relative flex h-5 w-full items-center"
                onClick={(e) => handleSeek(e, e.currentTarget.clientWidth)}
              >
                <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={onPrev} disabled={!hasPrev} className={navBtnClass} title="上一首">
                <BiSkipPrevious className="h-5 w-5" />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isPlaying ? (
                  <BiPause className="h-5 w-5" />
                ) : (
                  <BiPlay className="h-5 w-5" style={{ marginLeft: "2px" }} />
                )}
              </button>
              <button onClick={onNext} disabled={!hasNext} className={navBtnClass} title="下一首">
                <BiSkipNext className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 搜索弹窗 */}
      <LyricsSearchDialog
        isOpen={showSearchDialog}
        searchKeyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        onClose={() => setShowSearchDialog(false)}
        isSearching={isSearching}
        searchResults={searchResults}
        onSelectSong={selectSong}
      />
    </div>
  );
}
