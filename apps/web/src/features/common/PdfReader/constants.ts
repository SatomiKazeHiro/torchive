/**
 * PdfReader 组件常量
 */

import type { PdfThemeMode, ReadingMode } from "./types";
import { PDF_READER_PALETTE } from "@/features/common/readerThemes";

// 默认设置
export const DEFAULT_SETTINGS = {
  themeMode: "light" as PdfThemeMode,
  readingMode: "page" as ReadingMode,
  scale: 1.2,
  minScale: 0.6,
  maxScale: 3,
  scaleStep: 0.2,
};

// 主题样式 — 复用 readerThemes 的 palette
export const PDF_THEMES = PDF_READER_PALETTE;
