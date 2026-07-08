/**
 * LRC 歌词解析工具
 */

/**
 * 解析 LRC 歌词为时间戳到文本的映射
 * @param text LRC 格式歌词文本
 * @returns 时间戳（秒，保留 1 位小数）到歌词文本的映射
 */
export function parseLRCMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!text) return map;

  text.split("\n").forEach((line) => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, "0").slice(0, 3), 10);
      const lyricText = match[4].trim();
      if (lyricText) {
        const time = minutes * 60 + seconds + ms / 1000;
        map.set(Math.round(time * 10) / 10, lyricText);
      }
    }
  });
  return map;
}