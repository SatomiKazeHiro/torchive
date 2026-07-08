/**
 * 音乐播放器模板特定工具函数
 * 通用工具（formatTime / getBaseName / parseLRCMap）已迁出至 @/utils
 */

/**
 * 获取布局模式图标名称
 */
export function getLayoutIconName(mode: "left-right" | "right-left"): "list" | "text" {
  return mode === "left-right" ? "list" : "text";
}

/**
 * 获取布局描述
 */
export function getLayoutLabel(mode: "left-right" | "right-left"): string {
  return mode === "left-right" ? "歌单 | 歌词" : "歌词 | 歌单";
}

/**
 * 获取歌词字体大小类名
 */
export function getLyricTextSize(
  fontSize: "small" | "medium" | "large",
  isActive: boolean
): string {
  if (isActive) {
    return fontSize === "small" ? "text-lg" : fontSize === "medium" ? "text-xl" : "text-2xl";
  }
  return fontSize === "small" ? "text-sm" : fontSize === "medium" ? "text-base" : "text-lg";
}

/**
 * 获取歌词翻译字体大小类名
 */
export function getLyricTransSize(fontSize: "small" | "medium" | "large"): string {
  return fontSize === "small" ? "text-xs" : fontSize === "medium" ? "text-sm" : "text-base";
}