import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  usePlaylist,
  useLayout,
  useAudioPlayer,
  useAudioMetadata,
  useCoverColor,
  useLyrics,
  useMusicPlayState,
} from "./";
import { parseLRCMap } from "@/utils/lyric";
import type { MusicPlayTemplateProps } from "../types";
import type { SongResult } from "../../Mixture/types";

/**
 * 音乐播放器主 Hook
 *
 * 整合所有子 hooks，提供完整的音乐播放器功能
 */
export function useMusicPlayer({
  transformedWorkData,
  initialFilePath,
}: Pick<MusicPlayTemplateProps, "transformedWorkData" | "initialFilePath">) {
  // ===== 布局管理 =====
  const { layoutMode, cycleLayout, isPlaylistFirst } = useLayout();

  // ===== 播放控制状态 =====
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lyricFontSize, setLyricFontSize] = useState<"small" | "medium" | "large">("medium");
  const [lyricMode, setLyricMode] = useState<"both" | "original" | "translation">("both");

  // ===== 歌词搜索 Popper 状态 =====
  const [showSearchPopper, setShowSearchPopper] = useState(false);
  const [localSearchKeyword, setLocalSearchKeyword] = useState("");
  const [localSearchResults, setLocalSearchResults] = useState<SongResult[]>([]);
  const [localIsSearching, setLocalIsSearching] = useState(false);
  const [loadingSongId, setLoadingSongId] = useState<number | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);

  // ===== 歌词来源追踪 =====
  const [lyricSource, setLyricSource] = useState<"embedded" | "network" | "none">("none");

  // ===== 播放列表(纯数据) =====
  const { playlist, workTitle, workCover } = usePlaylist({ transformedWorkData });

  // ===== URL 状态(由短 hash 驱动,首屏 deep link 友好) =====
  const { currentIndex, currentAsset, setAsset } = useMusicPlayState(playlist, initialFilePath);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < playlist.length - 1;

  // ===== 歌单内导航(通过 setAsset 写回 URL) =====
  const playAtIndex = useCallback(
    (index: number) => {
      const item = playlist[index];
      if (item) setAsset(item.path);
    },
    [playlist, setAsset],
  );
  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      const item = playlist[currentIndex - 1];
      if (item) setAsset(item.path);
    }
  }, [currentIndex, playlist, setAsset]);
  const playNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      const item = playlist[currentIndex + 1];
      if (item) setAsset(item.path);
    }
  }, [currentIndex, playlist, setAsset]);

  // ===== 音频源 =====
  const currentItem = currentIndex >= 0 ? playlist[currentIndex] : null;
  const audioSrc = currentAsset || "";
  const prevAudioSrcRef = useRef(audioSrc);
  const wasPlayingRef = useRef(false);
  const isAutoPlayNextRef = useRef(false);

  // ===== 音频播放控制 =====
  const { isPlaying, currentTime, duration, audioRef, togglePlay, handleSeek } = useAudioPlayer({
    src: audioSrc,
  });

  // 监听播放状态变化
  useEffect(() => {
    wasPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // 音频源变化时，如果之前在播放或者是自动播放下一首，则继续播放
  useEffect(() => {
    if (audioSrc && audioSrc !== prevAudioSrcRef.current) {
      prevAudioSrcRef.current = audioSrc;
      // 延迟播放，等待音频加载
      if (wasPlayingRef.current || isAutoPlayNextRef.current) {
        isAutoPlayNextRef.current = false;
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              // 浏览器自动播放策略可能阻止播放，忽略错误
            });
          }
        }, 100);
      }
    }
  }, [audioSrc, audioRef]);

  // ===== 键盘快捷键 =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果搜索面板打开且有输入框有焦点，不处理快捷键
      if (showSearchPopper) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
          return;
        }
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (audioRef.current) {
            const newTime = Math.max(0, audioRef.current.currentTime - 5);
            audioRef.current.currentTime = newTime;
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (audioRef.current && duration) {
            const newTime = Math.min(duration, audioRef.current.currentTime + 5);
            audioRef.current.currentTime = newTime;
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, duration, showSearchPopper, audioRef]);

  // ===== 音频元数据解析 =====
  const { coverUrl: audioCoverUrl, parsedLyrics: embeddedLyrics } = useAudioMetadata(audioSrc);
  const effectiveCoverUrl = audioCoverUrl || workCover;

  // ===== 封面颜色提取 =====
  const {
    dominantColor,
    secondaryColor,
    isLoaded: isColorLoaded,
  } = useCoverColor(effectiveCoverUrl, { defaultDark: true });

  // ===== 歌词管理 =====
  const {
    lyrics,
    setLyrics,
    currentLyricIndex,
    isLoadingLyric,
    lyricStatus,
    lyricContainerRef,
    activeLyricRef,
  } = useLyrics({
    fileName: currentItem?.fileName || "",
    currentTime,
    duration,
    embeddedLyrics,
  });

  // ===== 计算属性 =====
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentFileName = currentItem?.fileName || "";

  // 背景样式
  const backgroundStyle = useMemo(() => {
    if (!effectiveCoverUrl || !isColorLoaded) {
      return { background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)" };
    }
    return { background: `linear-gradient(180deg, ${dominantColor} 0%, ${secondaryColor} 100%)` };
  }, [effectiveCoverUrl, isColorLoaded, dominantColor, secondaryColor]);

  // ===== 副作用 =====

  // 追踪歌词来源
  useEffect(() => {
    if (lyrics.length === 0) {
      setLyricSource("none");
    } else if (embeddedLyrics.length > 0) {
      setLyricSource("embedded");
    } else {
      setLyricSource("network");
    }
  }, [lyrics, embeddedLyrics]);

  // 歌曲切换时重置滚动位置到顶部
  const prevFileNameRef = useRef(currentFileName);
  useEffect(() => {
    if (currentFileName !== prevFileNameRef.current) {
      prevFileNameRef.current = currentFileName;
      if (lyricContainerRef.current) {
        lyricContainerRef.current.scrollTo({
          top: 0,
          behavior: "auto",
        });
      }
    }
  }, [currentFileName, lyricContainerRef]);

  // 歌词加载完成后滚动到第一行
  useEffect(() => {
    if (lyrics.length > 0 && lyricContainerRef.current) {
      const timer = setTimeout(() => {
        if (lyricContainerRef.current) {
          lyricContainerRef.current.scrollTo({
            top: 0,
            behavior: "auto",
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lyrics.length, lyricContainerRef]);

  // 滚动到当前歌词
  useEffect(() => {
    if (activeLyricRef.current && lyricContainerRef.current && lyrics.length > 0) {
      const scrollToLyric = () => {
        if (!activeLyricRef.current || !lyricContainerRef.current) return;

        const container = lyricContainerRef.current;
        const element = activeLyricRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const elementRelativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const scrollTop = elementRelativeTop - containerRect.height / 2 + elementRect.height / 2;

        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "smooth",
        });
      };
      requestAnimationFrame(scrollToLyric);
    }
  }, [currentLyricIndex, layoutMode, lyrics.length, lyricContainerRef, activeLyricRef]);

  // 重置搜索状态当关闭面板时
  useEffect(() => {
    if (!showSearchPopper) {
      setSelectedSongId(null);
      setLoadingSongId(null);
    }
  }, [showSearchPopper]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audioRef]);

  // ===== 回调函数 =====

  const handlePrev = useCallback(() => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      playAtIndex(randomIndex);
    } else {
      playPrev();
    }
  }, [isShuffle, playlist.length, playAtIndex, playPrev]);

  const handleNext = useCallback(() => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      playAtIndex(randomIndex);
    } else {
      playNext();
    }
  }, [isShuffle, playlist.length, playAtIndex, playNext]);

  // 音频结束处理
  useEffect(() => {
    const handleEnded = () => {
      if (repeatMode === "one") {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      } else if (hasNext || repeatMode === "all") {
        // 标记为自动播放下一首
        isAutoPlayNextRef.current = true;
        handleNext();
      }
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("ended", handleEnded);
      return () => audio.removeEventListener("ended", handleEnded);
    }
  }, [repeatMode, hasNext, handleNext, audioRef]);

  // 搜索功能
  const performSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;

    setLocalIsSearching(true);
    try {
      const res = await fetch(
        `/api-netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1`,
      );
      const data = await res.json();
      setLocalSearchResults(data.result?.songs?.slice(0, 8) || []);
    } catch {
      setLocalSearchResults([]);
    } finally {
      setLocalIsSearching(false);
    }
  }, []);

  const handleOpenSearch = useCallback(() => {
    const keyword = currentItem?.fileName?.replace(/\.[^/.]+$/, "") || "";
    setLocalSearchKeyword(keyword);
    setShowSearchPopper(true);
    setLocalSearchResults([]);
    performSearch(keyword);
  }, [currentItem, performSearch]);

  const handleManualSearch = useCallback(() => {
    performSearch(localSearchKeyword);
  }, [localSearchKeyword, performSearch]);

  // 选择歌曲获取歌词
  const handleSelectSong = useCallback(
    async (songId: number) => {
      if (loadingSongId === songId) return;

      setLoadingSongId(songId);
      try {
        const res = await fetch(`/api-netease/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`);
        const data = await res.json();
        if (data.lrc?.lyric) {
          const originalMap = parseLRCMap(data.lrc.lyric);
          const transMap = parseLRCMap(data.tlyric?.lyric || "");
          const allTimes = Array.from(new Set([...originalMap.keys(), ...transMap.keys()])).sort(
            (a, b) => a - b,
          );

          const parsedLyrics = allTimes
            .map((time) => {
              const text = originalMap.get(time);
              const translation = transMap.get(time);
              return text ? { time, text, translation } : { time, text: translation || "" };
            })
            .filter((line) => line.text);

          setLyrics(parsedLyrics);
          setLyricSource("network");
          setSelectedSongId(songId);
        }
      } catch (err) {
        console.error("Failed to load lyric:", err);
      } finally {
        setLoadingSongId(null);
      }
    },
    [setLyrics, loadingSongId],
  );

  // 切换字体大小
  const cycleFontSize = useCallback(() => {
    setLyricFontSize((prev) => {
      if (prev === "small") return "medium";
      if (prev === "medium") return "large";
      return "small";
    });
  }, []);

  // 切换歌词模式
  const cycleLyricMode = useCallback(() => {
    setLyricMode((prev) => {
      if (prev === "both") return "original";
      if (prev === "original") return "translation";
      return "both";
    });
  }, []);

  return {
    // 播放列表
    playlist,
    currentIndex,
    currentItem,
    playAtIndex,
    hasPrev,
    hasNext,
    workTitle,
    workCover,

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
  };
}
