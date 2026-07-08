import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  EBOOK_EXTENSIONS,
} from "../constants/media";

/**
 * 判断是否为音频文件
 */
export function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  // 强制类型收窄，提高安全性
  return (AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * 过滤音频文件
 */
export function filterAudioFiles(files: string[]): string[] {
  return files.filter(isAudioFile);
}

/**
 * 判断是否为图片文件
 */
export function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * 过滤图片文件
 */
export function filterImageFiles(files: string[]): string[] {
  return files.filter(isImageFile);
}

/**
 * 判断是否为视频文件
 */
export function isVideoFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return (VIDEO_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * 过滤视频文件
 */
export function filterVideoFiles(files: string[]): string[] {
  return files.filter(isVideoFile);
}

/**
 * 判断是否为电子书文件
 */
export function isEbookFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return (EBOOK_EXTENSIONS as readonly string[]).includes(ext);
}

// 过滤电子书文件
export function filterEbookFiles(files: string[]): string[] {
  return files.filter(isEbookFile);
}

/**
 * 提取文件的显示名称
 * - 去掉路径
 * - 去掉扩展名
 * - 去掉开头的数字序号（如 "1-"）
 * - 过长时添加省略号
 */
export function getFileDisplayName(path: string, maxLength: null | number = null): string {
  // 提取文件名
  let name = path.split("/").pop() || path;

  // 去掉扩展名
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex > 0) {
    name = name.slice(0, lastDotIndex);
  }

  // 去掉开头的数字序号（如 "1-"、"01-"、"001 - " 等）
  name = name.replace(/^\d+\s*[-.:\s]\s*/, "");

  // 过长时截断并添加省略号
  if (maxLength !== null && name.length > maxLength) {
    name = name.slice(0, maxLength) + "...";
  }

  return name;
}

/**
 * 从完整路径中提取文件名（含扩展名）
 */
export function getFileName(filePath: string): string {
  return filePath.split("/").pop() || filePath;
}

/**
 * 从文件名去除扩展名
 */
export function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}
