import { useState, useCallback, useRef, useEffect } from "react";
import { useUnmount } from "ahooks";
import type { LyricLine } from "../../types";
import { getBaseName } from "@/utils/fileHelper";

interface UseLyricsOptions {
  /** 当前播放的文件名 */
  fileName: string;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 音频总时长（秒） */
  duration: number;
  /** 音频文件内嵌的歌词 */
  embeddedLyrics: LyricLine[];
}

interface UseLyricsReturn {
  // 面板状态
  showLyricPanel: boolean;
  setShowLyricPanel: (show: boolean) => void;
  
  // 搜索弹窗状态
  showSearchDialog: boolean;
  setShowSearchDialog: (show: boolean) => void;
  
  // 搜索相关
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  searchResults: Array<{ id: number; name: string; artists: { name: string }[]; album: { name: string } }>;
  isSearching: boolean;
  
  // 歌词数据
  lyrics: LyricLine[];
  setLyrics: (lyrics: LyricLine[]) => void;
  currentLyricIndex: number;
  isLoadingLyric: boolean;
  
  // 显示设置
  lyricMode: "both" | "original" | "translation";
  setLyricMode: React.Dispatch<React.SetStateAction<"both" | "original" | "translation">>;
  lyricFontSize: "small" | "medium" | "large";
  setLyricFontSize: React.Dispatch<React.SetStateAction<"small" | "medium" | "large">>;
  
  // 歌词状态
  lyricStatus: "none" | "pure_music" | "not_collected" | "loaded";
  
  // DOM 引用
  lyricContainerRef: React.RefObject<HTMLDivElement | null>;
  activeLyricRef: React.RefObject<HTMLDivElement | null>;
  
  // 方法
  searchAndAutoSelect: () => Promise<void>;
  openSearchDialog: () => Promise<void>;
  handleSearch: () => Promise<void>;
  selectSong: (songId: number) => Promise<void>;
  loadEmbeddedLyrics: () => boolean;
  scrollElementToCenter: (element: HTMLElement, behavior?: ScrollBehavior) => void;
}

/**
 * 歌词管理 Hook
 *
 * 功能：
 * - 自动加载内嵌歌词或搜索在线歌词
 * - 同步当前播放的歌词行
 * - 自动滚动到当前歌词
 * - 支持歌词搜索弹窗
 * 
 * 使用 ahooks：
 * - useUnmount: 清理状态
 *
 * @param options - 配置选项
 * @returns 歌词管理相关状态和操作
 */
export function useLyrics({
  fileName,
  currentTime,
  embeddedLyrics,
}: UseLyricsOptions): UseLyricsReturn {
  // ===== 状态 =====
  const [showLyricPanel, setShowLyricPanel] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ id: number; name: string; artists: { name: string }[]; album: { name: string } }>
  >([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLyric, setIsLoadingLyric] = useState(false);
  const [lyricMode, setLyricMode] = useState<"both" | "original" | "translation">("both");
  const [lyricFontSize, setLyricFontSize] = useState<"small" | "medium" | "large">("medium");
  const [lyricStatus, setLyricStatus] = useState<"none" | "pure_music" | "not_collected" | "loaded">("none");

  // ===== Refs =====
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const hasAutoSearchedRef = useRef(false);
  const prevLyricsLengthRef = useRef(0);

  // ===== Effects =====

  // 当文件名变化时（切换歌曲），重置歌词状态
  useEffect(() => {
    setLyrics([]);
    setCurrentLyricIndex(-1);
    setSearchResults([]);
    setShowSearchDialog(false);
    setLyricStatus("none");
    hasAutoSearchedRef.current = false;
    prevLyricsLengthRef.current = 0;
  }, [fileName]);

  // 同步当前歌词索引
  useEffect(() => {
    if (lyrics.length === 0) return;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) index = i;
      else break;
    }
    setCurrentLyricIndex(index);
  }, [currentTime, lyrics]);

  /**
   * 滚动指定元素到容器中间
   */
  const scrollElementToCenter = useCallback(
    (element: HTMLElement, behavior: ScrollBehavior = "smooth") => {
      if (!lyricContainerRef.current) return;
      const container = lyricContainerRef.current;
      container.scrollTo({
        top: element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2,
        behavior,
      });
    },
    [],
  );

  // 当歌曲重新开始播放时（currentTime 接近 0），滚动到第一行歌词
  useEffect(() => {
    if (lyrics.length > 0 && currentTime < 0.5 && lyricContainerRef.current) {
      const firstLyricElement = lyricContainerRef.current.querySelector("[data-lyric-index]") as HTMLElement;
      if (firstLyricElement) {
        scrollElementToCenter(firstLyricElement, "smooth");
      }
    }
  }, [currentTime, lyrics.length, scrollElementToCenter]);

  // 滚动到当前歌词
  useEffect(() => {
    if (activeLyricRef.current && lyricContainerRef.current) {
      scrollElementToCenter(activeLyricRef.current, "smooth");
    }
  }, [currentLyricIndex, scrollElementToCenter]);

  // 歌词加载后，将第一行歌词滚动到中间
  useEffect(() => {
    if (lyrics.length > 0 && prevLyricsLengthRef.current === 0) {
      setTimeout(() => {
        const container = lyricContainerRef.current;
        if (!container) return;
        const firstLyricElement = container.querySelector("[data-lyric-index]") as HTMLElement;
        if (firstLyricElement) {
          scrollElementToCenter(firstLyricElement, "auto");
        }
      }, 0);
    }
    prevLyricsLengthRef.current = lyrics.length;
  }, [lyrics, scrollElementToCenter]);

  // 切换歌词模式后，重新滚动到当前歌词
  useEffect(() => {
    if (activeLyricRef.current && lyrics.length > 0) {
      setTimeout(() => {
        if (activeLyricRef.current) {
          scrollElementToCenter(activeLyricRef.current, "auto");
        }
      }, 0);
    }
  }, [lyricMode, scrollElementToCenter, lyrics.length]);

  // ===== 歌词解析 =====

  /**
   * 解析 LRC 歌词文本
   */
  const parseLyrics = useCallback((originalLrc: string, transLrc: string): LyricLine[] => {
    const parseMap = (text: string) => {
      const map = new Map<number, string>();
      text.split("\n").forEach((line) => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
          const time =
            parseInt(match[1]) * 60 +
            parseInt(match[2]) +
            parseInt(match[3].padEnd(3, "0").slice(0, 3)) / 1000;
          const txt = match[4].trim();
          if (txt) map.set(Math.round(time * 10) / 10, txt);
        }
      });
      return map;
    };

    const originalMap = parseMap(originalLrc);
    const transMap = parseMap(transLrc);
    const allTimes = Array.from(new Set([...originalMap.keys(), ...transMap.keys()])).sort(
      (a, b) => a - b,
    );

    return allTimes
      .map((time) => {
        const text = originalMap.get(time);
        const translation = transMap.get(time);
        return text ? { time, text, translation } : { time, text: translation || "" };
      })
      .filter((line) => line.text);
  }, []);

  // ===== 歌词加载方法 =====

  /**
   * 加载音频内嵌的歌词
   */
  const loadEmbeddedLyrics = useCallback(() => {
    if (embeddedLyrics.length > 0) {
      setLyrics(embeddedLyrics);
      setShowLyricPanel(true);
      return true;
    }
    return false;
  }, [embeddedLyrics]);

  // 当内嵌歌词解析完成时，自动加载
  useEffect(() => {
    if (hasAutoSearchedRef.current) return;

    if (embeddedLyrics.length > 0) {
      setLyrics(embeddedLyrics);
      hasAutoSearchedRef.current = true;
    } else if (fileName) {
      hasAutoSearchedRef.current = true;
      autoSearchFirstResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddedLyrics, fileName]);

  /**
   * 自动搜索并使用第一个结果
   */
  const autoSearchFirstResult = useCallback(async () => {
    if (!fileName || fileName === "未知文件") return;

    setIsLoadingLyric(true);
    setLyricStatus("none");
    try {
      const keyword = getBaseName(fileName);
      const res = await fetch(
        `/api-netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1`,
      );
      const data = await res.json();
      if (data.result?.songs?.length > 0) {
        const song = data.result.songs[0];
        const lyricRes = await fetch(`/api-netease/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1`);
        const lyricData = await lyricRes.json();
        if (lyricData.lrc?.lyric) {
          setLyrics(parseLyrics(lyricData.lrc.lyric, lyricData.tlyric?.lyric || ""));
          setLyricStatus("loaded");
        } else if (lyricData.nolyric === true || lyricData.unmanned === true) {
          setLyricStatus("pure_music");
        } else {
          setLyricStatus("not_collected");
        }
      }
    } catch (e) {
      console.warn("Auto lyric search failed:", e);
    } finally {
      setIsLoadingLyric(false);
    }
  }, [fileName, parseLyrics]);

  /**
   * 搜索并自动选择（用于手动点击"歌词"按钮）
   */
  const searchAndAutoSelect = useCallback(async () => {
    setShowLyricPanel(true);
    if (loadEmbeddedLyrics()) return;

    const keyword = getBaseName(fileName);
    setIsLoadingLyric(true);
    try {
      const res = await fetch(
        `/api-netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1`,
      );
      const data = await res.json();
      if (data.result?.songs?.length > 0) {
        const song = data.result.songs[0];
        const lyricRes = await fetch(`/api-netease/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1`);
        const lyricData = await lyricRes.json();
        if (lyricData.lrc?.lyric) {
          setLyrics(parseLyrics(lyricData.lrc.lyric, lyricData.tlyric?.lyric || ""));
          setLyricStatus("loaded");
        } else if (lyricData.nolyric === true || lyricData.unmanned === true) {
          setLyricStatus("pure_music");
        } else {
          setLyricStatus("not_collected");
        }
      } else {
        console.warn("No songs found for:", keyword);
        setLyricStatus("not_collected");
      }
    } catch (e) {
      console.warn("Search failed:", e);
    } finally {
      setIsLoadingLyric(false);
    }
  }, [fileName, loadEmbeddedLyrics, parseLyrics]);

  /**
   * 执行搜索（用于弹窗内提交）
   */
  const handleSearch = useCallback(async () => {
    const keyword = searchKeyword.trim() || getBaseName(fileName);
    if (!keyword) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api-netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1`,
      );
      const data = await res.json();
      setSearchResults(data.result?.songs?.slice(0, 8) || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [fileName, searchKeyword]);

  /**
   * 打开搜索弹窗
   */
  const openSearchDialog = useCallback(async () => {
    const keyword = getBaseName(fileName);
    setSearchKeyword(keyword);
    setShowSearchDialog(true);
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api-netease/api/search/get?s=${encodeURIComponent(keyword)}&type=1`,
      );
      const data = await res.json();
      setSearchResults(data.result?.songs?.slice(0, 8) || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [fileName]);

  /**
   * 选择歌曲
   */
  const selectSong = useCallback(async (songId: number) => {
    setIsLoadingLyric(true);
    setShowSearchDialog(false);
    try {
      const res = await fetch(`/api-netease/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`);
      const data = await res.json();
      if (data.lrc?.lyric) {
        setLyrics(parseLyrics(data.lrc.lyric, data.tlyric?.lyric || ""));
        setLyricStatus("loaded");
        setShowLyricPanel(true);
      } else if (data.nolyric === true || data.unmanned === true) {
        setLyricStatus("pure_music");
        setShowLyricPanel(true);
      } else {
        setLyricStatus("not_collected");
        setShowLyricPanel(true);
      }
    } catch {
      alert("获取歌词失败");
    } finally {
      setIsLoadingLyric(false);
    }
  }, [parseLyrics]);

  // 使用 ahooks useUnmount 清理
  useUnmount(() => {
    hasAutoSearchedRef.current = false;
    prevLyricsLengthRef.current = 0;
  });

  return {
    showLyricPanel,
    setShowLyricPanel,
    showSearchDialog,
    setShowSearchDialog,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    lyrics,
    setLyrics,
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
    loadEmbeddedLyrics,
    scrollElementToCenter,
  };
}
