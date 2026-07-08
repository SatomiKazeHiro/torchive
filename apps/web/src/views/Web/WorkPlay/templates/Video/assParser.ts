/**
 * ASS 字幕解析器 - 弹幕版
 * 只解析包含 \move、\pos、\a6/an6 特效的字幕，转换为弹幕格式
 */

import type { Danmu } from "./types";

// 默认视频高度（用于计算弹幕位置）
const DEFAULT_VIDEO_HEIGHT = 1080;

/**
 * 将 ASS 时间格式 (H:MM:SS.cc) 转换为秒
 */
function parseAssTime(timeStr: string): number {
  const parts = timeStr.trim().split(/[:.]/);
  if (parts.length !== 4) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const centiseconds = parseInt(parts[3], 10);

  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
}

/**
 * 解析 ASS 颜色 (&HBBGGRR& 或 &HBBGGRRAA& 格式)
 */
function parseAssColor(colorStr: string): string | undefined {
  if (!colorStr) return undefined;

  // 移除 &H 前缀和 & 后缀
  const clean = colorStr.replace(/^&H?/, "").replace(/&$/, "");
  if (clean.length !== 6 && clean.length !== 8) return undefined;

  // ASS 颜色是 BBGGRR 格式，需要转换为 RRGGBB
  const b = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const r = clean.substring(4, 6);

  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * 检查是否包含弹幕特效（\move、\pos、\a6/an6）
 * 返回解析出的信息
 */
function parseDanmuTags(text: string): {
  hasMove: boolean;
  hasPos: boolean;
  hasA6: boolean;
  posY?: number; // 用于判断顶部/底部
  color?: string;
  borderColor?: string; // 描边颜色
  cleanText: string;
} {
  const result = {
    hasMove: false,
    hasPos: false,
    hasA6: false,
    posY: undefined as number | undefined,
    color: undefined as string | undefined,
    borderColor: undefined as string | undefined,
    cleanText: text,
  };

  // 检查 \move(x1,y1,x2,y2) - 滚动弹幕
  const moveMatch = text.match(/\\move\(([^)]+)\)/);
  if (moveMatch) {
    result.hasMove = true;
    const coords = moveMatch[1].split(/\s*,\s*/).map(Number);
    if (coords.length >= 2) {
      result.posY = coords[1]; // 记录Y坐标（可能用于调试或其他用途）
    }
  }

  // 检查 \pos(x,y) - 固定位置弹幕
  const posMatch = text.match(/\\pos\(([^)]+)\)/);
  if (posMatch) {
    result.hasPos = true;
    const coords = posMatch[1].split(/\s*,\s*/).map(Number);
    if (coords.length >= 2) {
      result.posY = coords[1];
    }
  }

  // 检查 \an6 或 \a6（居中）
  // 样品中是 \a6 紧跟着 \pos，如：{\a6\pos(960, 200)}
  if (/\\an6\b/.test(text) || /\\a6\b/.test(text)) {
    result.hasA6 = true;
  }

  // 解析主颜色 \c 或 \1c（主文字颜色）
  const cMatch = text.match(/\\[1]?c(&H[0-9A-Fa-f]+&?)/);
  if (cMatch) {
    result.color = parseAssColor(cMatch[1]);
  }

  // 解析描边颜色 \3c（边框颜色）
  const borderColorMatch = text.match(/\\3c(&H[0-9A-Fa-f]+&?)/);
  if (borderColorMatch) {
    result.borderColor = parseAssColor(borderColorMatch[1]);
  }

  // 清理文本中的标签
  // 需要彻底清理所有 ASS 标签
  result.cleanText = text
    // 第一步：移除带参数的标签如 \move(), \pos()
    .replace(/\\[a-zA-Z]+\([^)]*\)/gi, "")
    // 第二步：移除颜色标签 \c, \1c, \2c, \3c, \4c 及其颜色值
    .replace(/\\[1-4]?c&H[0-9A-Fa-f]+&?/gi, "")
    // 第三步：移除其他简单标签（纯字母+数字）
    .replace(/\\[a-zA-Z]+\d*/gi, "")
    // 第四步：移除花括号
    .replace(/[{}]/g, "")
    // 第五步：处理特殊转义
    .replace(/\\N/gi, "") // 硬换行
    .replace(/\\n/gi, "") // 软换行
    .replace(/\\h/g, " ") // 硬空格
    .trim();

  return result;
}

/**
 * 根据Y坐标判断固定弹幕模式
 * @param y Y坐标
 * @param videoHeight 视频高度（默认1080）
 * @returns 1: 顶部, 2: 底部
 */
function getFixedModeByY(y: number, videoHeight: number = DEFAULT_VIDEO_HEIGHT): 1 | 2 {
  // 上半部分为顶部弹幕，下半部分为底部弹幕
  const threshold = videoHeight / 2;
  if (y < threshold) {
    return 1; // 顶部
  } else {
    return 2; // 底部
  }
}

/**
 * 确定弹幕模式
 *
 * 规则：
 * - \move -> 滚动弹幕 (mode=0)
 * - \pos (+ \a6可选) -> 固定弹幕，根据Y坐标判断顶部(1)/底部(2)
 * - 只有 \a6 没有 \pos -> 无法判断位置，默认滚动(0)
 */
function determineMode(tags: ReturnType<typeof parseDanmuTags>): 0 | 1 | 2 {
  // \move 总是滚动弹幕
  if (tags.hasMove) {
    return 0; // 滚动
  }

  // \pos 根据 Y 坐标判断顶部/底部
  if (tags.hasPos && tags.posY !== undefined) {
    return getFixedModeByY(tags.posY);
  }

  // 只有 \a6，没有位置信息，默认滚动
  if (tags.hasA6) {
    return 0;
  }

  return 0; // 默认滚动
}

/**
 * 解析 ASS Dialogue 行，提取字段
 * 处理花括号内的逗号不被当作分隔符
 */
function parseDialogueLine(line: string, formatColumns: string[]): string[] {
  const dialogueStr = line.substring(9).trim(); // 移除 "Dialogue:"

  const fields: string[] = [];
  let current = "";
  let braceDepth = 0;
  let fieldCount = 0;

  for (let i = 0; i < dialogueStr.length; i++) {
    const char = dialogueStr[i];

    if (char === "{") {
      braceDepth++;
      current += char;
    } else if (char === "}") {
      braceDepth--;
      current += char;
    } else if (char === "," && braceDepth === 0 && fieldCount < formatColumns.length - 1) {
      fields.push(current.trim());
      current = "";
      fieldCount++;
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

/**
 * 将 ASS 字幕内容解析为弹幕数组
 * 只解析包含 \move、\pos、\a6/an6 的行
 */
export function parseAssToDanmuku(assContent: string): Danmu[] {
  const danmuku: Danmu[] = [];
  const lines = assContent.split(/\r?\n/);

  let inEventsSection = false;
  let formatColumns: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith(";")) continue;

    // 检测 Events 段落
    if (trimmed === "[Events]") {
      inEventsSection = true;
      continue;
    }

    // 检测其他段落，重置状态
    if (trimmed.startsWith("[")) {
      inEventsSection = false;
      continue;
    }

    if (!inEventsSection) continue;

    // 解析 Format 行
    if (trimmed.startsWith("Format:")) {
      const formatStr = trimmed.substring(7).trim();
      formatColumns = formatStr.split(/\s*,\s*/).map((s) => s.trim());
      continue;
    }

    // 解析 Dialogue 行
    if (trimmed.startsWith("Dialogue:")) {
      // 如果还没看到 Format，跳过
      if (formatColumns.length === 0) continue;

      const fields = parseDialogueLine(trimmed, formatColumns);

      // 查找字段索引
      const startIdx = formatColumns.indexOf("Start");
      const textIdx = formatColumns.indexOf("Text");

      if (startIdx === -1 || textIdx === -1) continue;
      if (fields.length <= Math.max(startIdx, textIdx)) continue;

      const startTime = parseAssTime(fields[startIdx] || "0:00:00.00");
      const text = fields[textIdx] || "";

      // 解析弹幕标签
      const tags = parseDanmuTags(text);

      // 只处理包含 \move、\pos 或 \a6/an6 的行
      if (!tags.hasMove && !tags.hasPos && !tags.hasA6) {
        continue;
      }

      // 确定弹幕模式
      const mode = determineMode(tags);

      // 创建弹幕项
      const danmu: Danmu = {
        text: tags.cleanText,
        time: startTime,
        mode,
      };

      // 如果有主颜色则设置
      if (tags.color) {
        danmu.color = tags.color;
      }

      // 如果有描边颜色则设置文字描边样式
      if (tags.borderColor) {
        danmu.style = {
          webkitTextStroke: `0.1px ${tags.borderColor}`,
        };
      }

      danmuku.push(danmu);
    }
  }

  return danmuku
    .filter((i) => i.time !== undefined && isFinite(i.time))
    .sort((a, b) => a.time! - b.time!);
}

/**
 * 从 URL 加载并解析 ASS 字幕为弹幕
 */
export async function loadAssDanmuku(url: string): Promise<Danmu[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ASS: ${response.status}`);
    }
    const content = await response.text();
    return parseAssToDanmuku(content);
  } catch (error) {
    console.error("Failed to load ASS danmuku:", error);
    return [];
  }
}
