import { useState, useEffect, useCallback, useRef } from "react";
import { useUnmount } from "ahooks";
import type * as mmType from "music-metadata";
import type { LyricLine } from "../../types";

interface AudioMetadata {
  /** 封面图片 Blob URL */
  coverUrl: string | null;
  /** 内嵌歌词原文 */
  embeddedLyrics: string | null;
  /** 歌曲标题 */
  title: string | null;
  /** 艺术家 */
  artist: string | null;
  /** 专辑 */
  album: string | null;
  /** 是否成功解析元数据 */
  hasMetadata: boolean;
}

interface UseAudioMetadataReturn extends AudioMetadata {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 解析后的歌词数组 */
  parsedLyrics: LyricLine[];
}

/**
 * 解析 LRC 格式歌词
 * @param lrcText - LRC 格式的歌词文本
 * @returns 按时间排序的歌词行数组
 */
function parseLRCLyrics(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match;

  while ((match = lrcRegex.exec(lrcText)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, "0").slice(0, 3), 10);
    const text = match[4].trim();

    if (text) {
      lines.push({
        time: minutes * 60 + seconds + ms / 1000,
        text,
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * 从多种标签格式中提取歌词
 * 支持标准 lyrics 字段和 ID3v2 USLT 标签
 * @param metadata - music-metadata 解析后的元数据
 * @returns 歌词文本或 null
 */
function extractLyrics(metadata: mmType.IAudioMetadata): string | null {
  const common = metadata.common;

  // 1. 尝试标准 lyrics 字段
  if (common.lyrics && common.lyrics.length > 0) {
    const lyricText = common.lyrics
      .map((lyric) => (typeof lyric === "string" ? lyric : lyric.text))
      .join("\n");
    if (lyricText.trim()) return lyricText;
  }

  // 2. 尝试 ID3v2.3/2.4 USLT (Unsynchronized lyrics) 标签
  const native = metadata.native as Record<string, unknown> | undefined;
  if (native) {
    const id3v24 = native["ID3v2.4"] || native["ID3v2.3"] || native["ID3v2.2"];
    if (id3v24 && Array.isArray(id3v24)) {
      const uslt = id3v24.find(
        (tag: unknown) =>
          typeof tag === "object" &&
          tag !== null &&
          "id" in tag &&
          (tag as { id: string }).id === "USLT"
      );
      if (uslt && "text" in uslt) {
        return String((uslt as { text: string }).text);
      }
    }
  }

  return null;
}

/**
 * 音频元数据 Hook
 * 
 * 解析音频文件的元数据（封面、歌词、标题等）
 * 使用 useUnmount 确保组件卸载时释放 Blob URL
 * 
 * @param src - 音频文件 URL
 * @returns 解析后的元数据和加载状态
 */
export function useAudioMetadata(src: string): UseAudioMetadataReturn {
  const [metadata, setMetadata] = useState<AudioMetadata>({
    coverUrl: null,
    embeddedLyrics: null,
    title: null,
    artist: null,
    album: null,
    hasMetadata: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 用于保存当前的 coverUrl，便于卸载时清理
  const coverUrlRef = useRef<string | null>(null);

  const parseMetadata = useCallback(async () => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    try {
      // 获取音频文件的 ArrayBuffer
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // 动态加载 music-metadata（仅在解析音频时按需加载）
      const mm = await import("music-metadata");
      const result = await mm.parseBlob(new Blob([arrayBuffer]));

      // 提取封面 - 创建 Blob URL
      let coverUrl: string | null = null;
      if (result.common.picture && result.common.picture.length > 0) {
        const picture = result.common.picture[0];
        const blob = new Blob([picture.data], { type: picture.format });
        coverUrl = URL.createObjectURL(blob);
        coverUrlRef.current = coverUrl;
      }

      // 提取歌词
      const embeddedLyrics = extractLyrics(result);

      setMetadata({
        coverUrl,
        embeddedLyrics,
        title: result.common.title || null,
        artist: result.common.artist || null,
        album: result.common.album || null,
        hasMetadata: true,
      });
    } catch (err) {
      console.warn("Failed to parse audio metadata:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setMetadata({
        coverUrl: null,
        embeddedLyrics: null,
        title: null,
        artist: null,
        album: null,
        hasMetadata: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [src]);

  useEffect(() => {
    parseMetadata();
  }, [src, parseMetadata]);

  // 使用 useUnmount 确保组件卸载时释放 Blob URL，防止内存泄漏
  useUnmount(() => {
    if (coverUrlRef.current) {
      URL.revokeObjectURL(coverUrlRef.current);
      coverUrlRef.current = null;
    }
  });

  // 解析歌词为结构化数组
  const parsedLyrics = metadata.embeddedLyrics
    ? parseLRCLyrics(metadata.embeddedLyrics)
    : [];

  return {
    ...metadata,
    isLoading,
    error,
    parsedLyrics,
  };
}
