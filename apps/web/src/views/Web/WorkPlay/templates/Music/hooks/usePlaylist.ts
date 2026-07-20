import { useMemo } from "react";
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
}

interface UsePlaylistReturn {
  /** 播放列表 */
  playlist: PlaylistItem[];
  /** 作品标题 */
  workTitle: string;
  /** 作品封面 */
  workCover: string | null;
}

/**
 * 歌单数据 Hook(纯数据,无状态)
 *
 * 作用:从作品数据中按顺序聚合音频文件,生成播放列表。
 * 当前播放索引由 useMusicPlayState(URL 状态)管理,不在此 hook 内。
 */
export function usePlaylist({ transformedWorkData }: UsePlaylistOptions): UsePlaylistReturn {
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

  // 作品信息
  const workTitle = useMemo(() => {
    return (
      transformedWorkData?.work?.detail?.title || transformedWorkData?.work?.work || "未知作品"
    );
  }, [transformedWorkData]);

  const workCover = useMemo(() => {
    return transformedWorkData?.work?.detail?.cover || null;
  }, [transformedWorkData]);

  return {
    playlist,
    workTitle,
    workCover,
  };
}
