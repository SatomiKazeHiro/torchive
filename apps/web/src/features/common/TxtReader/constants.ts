/**
 * TxtReader 组件常量
 */

import type { TxtThemeMode, ReadingMode, FontSize } from "./types";
import { TXT_READER_PALETTE } from "@/features/common/readerThemes";

// 默认设置
export const DEFAULT_SETTINGS = {
  themeMode: "parchment" as TxtThemeMode,
  readingMode: "scroll" as ReadingMode,
  fontSize: "medium" as FontSize,
};

// 字体大小映射（px）
export const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

// 行高倍数
export const LINE_HEIGHT_MAP: Record<FontSize, number> = {
  small: 1.8,
  medium: 1.8,
  large: 1.7,
  xlarge: 1.7,
};

// 虚拟列表配置
export const VIRTUAL_LIST_CONFIG = {
  OVERSCAN: 3,
  BOTTOM_PADDING_VH: 0.5, // 50vh
};

// 主题样式 - 三主题设计 — 复用 readerThemes 的 palette
export const TXT_THEMES = TXT_READER_PALETTE;

// 主题名称映射
export const THEME_NAMES: Record<TxtThemeMode, string> = {
  paper: "纸质",
  parchment: "羊皮纸",
  dark: "暗黑",
};

// 章节识别正则表达式
export const CHAPTER_PATTERNS = [
  // 第/序 + 章/幕/卷/篇 系列（最常用）
  {
    name: "第/序+章/幕/卷/篇",
    regex: /(?:^|\n|\r)\s*([第序]\s*[一二三四五六七八九十百千万\d]+\s*[章幕卷篇].*?)\s*(?:\n|\r|$)/,
    level: 1,
  },
  // 卷/集/回 系列
  {
    name: "卷/集/回",
    regex: /(?:^|\n|\r)\s*(第\s*[一二三四五六七八九十百千万\d]+\s*[卷集回].*?)\s*(?:\n|\r|$)/,
    level: 1,
  },
  // 英文 Chapter
  {
    name: "Chapter",
    regex: /(?:^|\n|\r)\s*(Chapter\s+\d+[.:]?\s*.+?)\s*(?:\n|\r|$)/i,
    level: 1,
  },
  // 简洁数字格式（可能是小节）
  {
    name: "数字+点/空格",
    regex: /(?:^|\n|\r)\s*(\d+[.、]\s*.+?)\s*(?:\n|\r|$)/,
    level: 2,
  },
  // 特殊标记
  {
    name: "【章节】格式",
    regex: /(?:^|\n|\r)\s*[【[]\s*(第?\s*\d+\s*[章节点卷]?)\s*[】]](.+?)?\s*(?:\n|\r|$)/,
    level: 1,
  },
  // 附录/后记/前言/序章/尾声
  {
    name: "特殊章节",
    regex: /(?:^|\n|\r)\s*((?:前言|后记|附录|序章|尾声|引言|楔子)\s*[：:]?\s*.+?)\s*(?:\n|\r|$)/i,
    level: 1,
  },
] as const;
