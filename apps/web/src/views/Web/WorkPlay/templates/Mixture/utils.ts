import type { MediaType, SectionItem, LyricLine, LyricMode, LyricFontSize } from "./types";
import type { EntitiesJson } from "@/types/db-instance";
import { sortFiles } from "@/utils/sort";
import { parseLRCMap } from "@/utils/lyric";

/**
 * 根据文件 URL 获取媒体类型
 */
export function getFileType(url: string): MediaType {
  const ext = url.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) return "image";
  if (["mp4", "webm", "ogg"].includes(ext || "")) return "video";
  if (["mp3", "wav", "ogg", "aac", "flac", "m4a", "webm", "opus", "wma"].includes(ext || "")) return "audio";
  if (["pdf"].includes(ext || "")) return "pdf";
  if (["txt", "json", "md", "log"].includes(ext || "")) return "text";
  return "unknown";
}

/**
 * 从 entities 生成手风琴项列表（按固定顺序：内容、sections、其他）
 *
 * 注意：传入的 entities 应该是已由 transformEntities 处理过的
 * assets 和 orphanAssets 中的路径已经是完整路径（如 /ts-api/resources/...）
 * section 中的 files 也已经是完整路径
 */
export function generateSectionItems(entities: EntitiesJson): SectionItem[] {
  const items: SectionItem[] = [];
  let order = 0;

  // 1. 内容项 (assets) - 排第一
  if (entities.assets && entities.assets.length > 0) {
    items.push({
      key: "section_assets",
      type: "assets",
      label: "内容",
      // 直接使用完整路径（已由 transformEntities 处理）
      files: sortFiles(entities.assets),
      order: order++,
    });
  }

  // 2. 章节项 (section) - 按原始顺序排在中间
  if (entities.section && entities.section.length > 0) {
    entities.section.forEach((sec, index) => {
      if (sec.files && sec.files.length > 0) {
        items.push({
          key: `section_${index}_${sec.name}`,
          type: "section",
          label: sec.name,
          sectionName: sec.name,
          // 直接使用完整路径（已由 transformEntities 处理）
          files: sortFiles(sec.files),
          order: order++,
        });
      }
    });
  }

  // 3. 其他项 (orphanAssets) - 排最后
  if (entities.orphanAssets && entities.orphanAssets.length > 0) {
    items.push({
      key: "section_orphan",
      type: "orphanAssets",
      label: "其他",
      // 直接使用完整路径（已由 transformEntities 处理）
      files: sortFiles(entities.orphanAssets),
      order: order++,
    });
  }

  return items;
}

// ==================== 歌词相关工具函数 ====================

/**
 * 解析并合并原文和翻译歌词
 */
export function parseLyrics(originalLrc: string, transLrc: string): LyricLine[] {
  const originalMap = parseLRCMap(originalLrc);
  const transMap = parseLRCMap(transLrc);

  const allTimes = new Set<number>([...originalMap.keys(), ...transMap.keys()]);
  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

  const result: LyricLine[] = [];

  for (const time of sortedTimes) {
    const text = originalMap.get(time);
    const translation = transMap.get(time);

    if (text) {
      result.push({ time, text, translation });
    } else if (translation) {
      result.push({ time, text: translation });
    }
  }

  return result;
}

/**
 * 获取歌词字体大小类名
 */
export function getLyricFontSizeClasses(size: LyricFontSize, isActive: boolean): string {
  const baseSize = isActive ? "font-medium" : "";
  switch (size) {
    case "small":
      return `${baseSize} text-sm`;
    case "medium":
      return `${baseSize} text-base`;
    case "large":
      return `${baseSize} text-lg`;
  }
}

/**
 * 获取翻译字体大小类名
 */
export function getTransFontSizeClasses(size: LyricFontSize, isActive: boolean): string {
  const baseStyle = isActive ? "" : "text-zinc-400 dark:text-zinc-500";
  switch (size) {
    case "small":
      return `${baseStyle} text-xs`;
    case "medium":
      return `${baseStyle} text-sm`;
    case "large":
      return `${baseStyle} text-base`;
  }
}

/**
 * 获取歌词模式标签
 */
export function getModeLabel(mode: LyricMode): string {
  switch (mode) {
    case "both": return "双语";
    case "original": return "原文";
    case "translation": return "翻译";
  }
}

/**
 * 获取字体大小标签
 */
export function getFontSizeLabel(size: LyricFontSize): string {
  switch (size) {
    case "small": return "小";
    case "medium": return "中";
    case "large": return "大";
  }
}

/**
 * 判断是否应该显示某行歌词
 */
export function shouldShowLine(line: LyricLine, mode: LyricMode): boolean {
  switch (mode) {
    case "original": return !!line.text;
    case "translation": return !!line.translation;
    case "both": return true;
  }
}

/**
 * 获取某行要显示的文本
 */
export function getLineText(line: LyricLine, mode: LyricMode): string {
  switch (mode) {
    case "original": return line.text;
    case "translation": return line.translation || "";
    case "both": return line.text;
  }
}
