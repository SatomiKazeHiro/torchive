/**
 * MobileTxtReader 组件常量
 */

import type { ThemeMode, FontSize } from "./types";
import { READER_OVERLAY_PALETTE } from "@/features/common/readerThemes";

// 默认设置
export const DEFAULT_SETTINGS = {
  themeMode: "parchment" as ThemeMode,
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
  BOTTOM_PADDING_VH: 0.5,
};

// 主题样式 — 复用 readerThemes 的 palette（Ebook / MobileTxtReader 共用暖色系）
export const THEME_STYLES = READER_OVERLAY_PALETTE;

// 章节识别正则表达式
export const CHAPTER_PATTERNS = [
  {
    name: "第/序+章/幕/卷/篇",
    regex: /(?:^|\n|\r)\s*([第序]\s*[一二三四五六七八九十百千万\d]+\s*[章幕卷篇].*?)\s*(?:\n|\r|$)/,
    level: 1,
  },
  {
    name: "卷/集/回",
    regex: /(?:^|\n|\r)\s*(第\s*[一二三四五六七八九十百千万\d]+\s*[卷集回].*?)\s*(?:\n|\r|$)/,
    level: 1,
  },
  {
    name: "Chapter",
    regex: /(?:^|\n|\r)\s*(Chapter\s+\d+[.:]?\s*.+?)\s*(?:\n|\r|$)/i,
    level: 1,
  },
  {
    name: "数字+点/空格",
    regex: /(?:^|\n|\r)\s*(\d+[.、]\s*.+?)\s*(?:\n|\r|$)/,
    level: 2,
  },
  {
    name: "【章节】格式",
    regex: /(?:^|\n|\r)\s*[【[]\s*(第?\s*\d+\s*[章节点卷]?)\s*[】]](.+?)?\s*(?:\n|\r|$)/,
    level: 1,
  },
  {
    name: "特殊章节",
    regex: /(?:^|\n|\r)\s*((?:前言|后记|附录|序章|尾声|引言|楔子)\s*[：:]?\s*.+?)\s*(?:\n|\r|$)/i,
    level: 1,
  },
] as const;

// 主题图标映射（用于底部栏）
export const THEME_NAMES: Record<ThemeMode, string> = {
  paper: "纸质",
  parchment: "羊皮纸",
  dark: "夜间",
};
