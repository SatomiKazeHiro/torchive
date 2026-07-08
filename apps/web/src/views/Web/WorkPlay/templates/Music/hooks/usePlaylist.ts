import { useState, useMemo, useCallback, useEffect } from "react";
import type { TransformedWorkData } from "../../Mixture";
import type { PlaylistItem } from "../types";
import { sortFiles } from "@/utils/sort";
import { getFileName } from "@/utils/fileHelper";

// 浏览器支持的音频格式
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "webm", "opus", "wma"];

/**
 * 判断是否为音频文件
 */
function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return AUDIO_EXTENSIONS.includes(ext);
}

interface UsePlaylistOptions {
  transformedWorkData: TransformedWorkData | null;
  initialFilePath?: string;
}

interface UsePlaylistReturn {
  /** 播放列表 */
  playlist: PlaylistItem[];
  /** 当前播放索引 */
  currentIndex: number;
  /** 当前播放的文件路径 */
  currentPath: string | null;
  /** 切换到指定索引 */
  playAtIndex: (index: number) => void;
  /** 切换到上一首 */
  playPrev: () => void;
  /** 切换到下一首 */
  playNext: () => void;
  /** 是否有上一首 */
  hasPrev: boolean;
  /** 是否有下一首 */
  hasNext: boolean;
  /** 作品标题 */
  workTitle: string;
  /** 作品封面 */
  workCover: string | null;
}

/**
 * 播放列表管理 Hook
 * 
 * 功能：
 * - 从作品数据生成播放列表（仅音频文件）
 * - 管理当前播放索引
 * - 提供上一首/下一首导航
 * - 支持初始文件路径定位
 */
export function usePlaylist({
  transformedWorkData,
  initialFilePath,
}: UsePlaylistOptions): UsePlaylistReturn {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 生成播放列表
  const playlist = useMemo<PlaylistItem[]>(() => {
    if (!transformedWorkData) return [];

    const { entities } = transformedWorkData;
    const items: PlaylistItem[] = [];
    let globalIndex = 0;

    // 1. assets 中的音频文件
    if (entities.assets) {
      sortFiles(entities.assets)
        .filter(isAudioFile)
        .forEach((path) => {
          items.push({
            id: `asset-${globalIndex}`,
            path,
            fileName: getFileName(path),
            section: "播放列表",
            index: globalIndex++,
          });
        });
    }

    // 2. section 中的音频文件
    if (entities.section) {
      entities.section.forEach((sec) => {
        sortFiles(sec.files)
          .filter(isAudioFile)
          .forEach((path) => {
            items.push({
              id: `section-${sec.name}-${globalIndex}`,
              path,
              fileName: getFileName(path),
              section: sec.name,
              index: globalIndex++,
            });
          });
      });
    }

    // 3. orphanAssets 中的音频文件
    if (entities.orphanAssets) {
      sortFiles(entities.orphanAssets)
        .filter(isAudioFile)
        .forEach((path) => {
          items.push({
            id: `orphan-${globalIndex}`,
            path,
            fileName: getFileName(path),
            section: "其他",
            index: globalIndex++,
          });
        });
    }

    return items;
  }, [transformedWorkData]);

  // 根据初始文件路径定位播放位置
  useEffect(() => {
    if (playlist.length === 0) return;

    if (initialFilePath) {
      const index = playlist.findIndex((item) => item.path === initialFilePath);
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        // 如果找不到，默认播放第一首
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(0);
    }
  }, [playlist, initialFilePath]);

  // 当前播放的文件路径
  const currentPath = useMemo(() => {
    if (playlist.length === 0) return null;
    return playlist[currentIndex]?.path || null;
  }, [playlist, currentIndex]);

  // 切换到指定索引
  const playAtIndex = useCallback((index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentIndex(index);
    }
  }, [playlist.length]);

  // 上一首
  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // 下一首
  const playNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, playlist.length]);

  // 作品信息
  const workTitle = useMemo(() => {
    return transformedWorkData?.work?.detail?.title || 
           transformedWorkData?.work?.work || 
           "未知作品";
  }, [transformedWorkData]);

  const workCover = useMemo(() => {
    return transformedWorkData?.work?.detail?.cover || null;
  }, [transformedWorkData]);

  return {
    playlist,
    currentIndex,
    currentPath,
    playAtIndex,
    playPrev,
    playNext,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < playlist.length - 1,
    workTitle,
    workCover,
  };
}
