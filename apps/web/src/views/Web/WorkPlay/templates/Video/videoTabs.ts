import type { EntitiesJson } from "@/types/db-instance";
import { sortFiles } from "@/utils/sort";
import { isVideoFile } from "@/utils/fileHelper";

export interface VideoTab {
  key: string;
  label: string;
  videos: string[];
}

/**
 * 生成视频 Tabs 配置
 */
export function generateVideoTabs(entities: EntitiesJson): VideoTab[] {
  const tabs: VideoTab[] = [];

  // assets → 正片
  const videoAssets = entities.assets.filter(isVideoFile);
  if (videoAssets.length > 0) {
    tabs.push({
      key: "main",
      label: "选集播放",
      videos: sortFiles(videoAssets),
    });
  }

  // section → 动态 tab
  if (entities.section && entities.section.length > 0) {
    entities.section.forEach((sec, index) => {
      const videoFiles = sec.files.filter(isVideoFile);
      if (videoFiles.length > 0) {
        tabs.push({
          key: `section_${index}`,
          label: sec.name,
          videos: sortFiles(videoFiles),
        });
      }
    });
  }

  // orphanAssets → 其他
  const videoOrphans = entities.orphanAssets.filter(isVideoFile);
  if (videoOrphans.length > 0) {
    tabs.push({
      key: "others",
      label: "其他",
      videos: sortFiles(videoOrphans),
    });
  }

  return tabs;
}