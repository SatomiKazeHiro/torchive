/**
 * 格式化文件大小
 * @param bytes - 字节数（可选）
 * @returns 格式化后的字符串，如 "1.5 GB"
 */
export function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${units[i]}`;
}

/**
 * 格式化时长（秒 → MM:SS）
 */
export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
