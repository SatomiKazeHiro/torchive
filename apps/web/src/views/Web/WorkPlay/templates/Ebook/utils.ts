/**
 * Ebook 模块工具函数
 */

import type { ChapterUnit, TocItem, SearchResult } from "./types";
import { EBOOK_EXTENSIONS, CHAPTER_PATTERNS } from "./constants";

// ==================== 文件相关 ====================

/** 获取文件扩展名 */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

/** 过滤电子书文件 */
export function filterEbookFiles(files: string[]): string[] {
  return files.filter((file) => {
    const ext = getFileExtension(file);
    return EBOOK_EXTENSIONS.includes(ext);
  });
}

/** 从 URL state 解析初始文件路径(已废弃:PlayView 直接把解析后的完整路径作为 initialFilePath 传入)
 *  保留是为了不破坏潜在外部引用;新代码请勿使用。
 *  @deprecated */
export function parseInitialFilePath(locationState: unknown): string | undefined {
  return (locationState as { filePath?: string })?.filePath;
}

// ==================== 章节相关 ====================

interface Paragraph {
  id: number;
  content: string;
}

/** 识别章节标题 */
export function recognizeChapter(text: string): { title: string; level: number } | null {
  for (const pattern of CHAPTER_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const title = match[1]?.trim() || text.trim();
      return {
        title: title.length > 100 ? title.slice(0, 100) + "..." : title,
        level: pattern.level,
      };
    }
  }
  return null;
}

/** 生成目录 */
export function generateToc(paragraphs: Paragraph[]): TocItem[] {
  const tocItems: TocItem[] = [];
  paragraphs.forEach((para, index) => {
    const chapter = recognizeChapter(para.content);
    if (chapter) {
      tocItems.push({
        id: para.id,
        title: chapter.title,
        level: chapter.level,
        paragraphIndex: index,
      });
    }
  });
  return tocItems;
}

// ==================== 搜索相关 ====================

/** 执行搜索（完全匹配） */
export function performSearch(paragraphs: Paragraph[], keyword: string): SearchResult[] {
  if (!keyword.trim()) return [];

  const results: SearchResult[] = [];
  const lowerKeyword = keyword.toLowerCase();

  paragraphs.forEach((para, index) => {
    const lowerContent = para.content.toLowerCase();
    const matches: Array<{ start: number; end: number }> = [];

    let pos = 0;
    while (true) {
      const idx = lowerContent.indexOf(lowerKeyword, pos);
      if (idx === -1) break;
      matches.push({ start: idx, end: idx + keyword.length });
      pos = idx + keyword.length;
    }

    if (matches.length > 0) {
      // 生成预览文本（前后各 30 个字符）
      const firstMatch = matches[0];
      const previewStart = Math.max(0, firstMatch.start - 30);
      const previewEnd = Math.min(para.content.length, firstMatch.end + 30);
      let preview = para.content.slice(previewStart, previewEnd);
      if (previewStart > 0) preview = "..." + preview;
      if (previewEnd < para.content.length) preview = preview + "...";

      results.push({
        id: para.id,
        paragraphIndex: index,
        content: preview,
        matches: matches.map((m) => ({
          start: m.start - previewStart + (previewStart > 0 ? 3 : 0),
          end: m.end - previewStart + (previewStart > 0 ? 3 : 0),
        })),
      });
    }
  });

  return results;
}

// ==================== 章节单元生成 ====================

interface EntitiesData {
  assets: string[];
  section?: { name: string; files: string[] }[];
  orphanAssets: string[];
}

/** 生成章节单元列表 */
export function generateChapterUnits(entities: EntitiesData): ChapterUnit[] {
  const units: ChapterUnit[] = [];

  // assets → 本篇
  const ebookAssets = filterEbookFiles(entities.assets);
  if (ebookAssets.length > 0) {
    units.push({
      key: "unit_assets",
      name: "本篇",
      files: ebookAssets,
      cover: null,
    });
  }

  // section → 各章节
  if (entities.section && entities.section.length > 0) {
    entities.section.forEach((sec, index) => {
      const ebookFiles = filterEbookFiles(sec.files);
      if (ebookFiles.length > 0) {
        units.push({
          key: `unit_section_${index}`,
          name: sec.name,
          files: ebookFiles,
          cover: null,
        });
      }
    });
  }

  // orphanAssets → 其他
  const ebookOrphans = filterEbookFiles(entities.orphanAssets);
  if (ebookOrphans.length > 0) {
    units.push({
      key: "unit_orphan",
      name: "其他",
      files: ebookOrphans,
      cover: null,
    });
  }

  return units;
}

/** 查找文件所在章节索引 */
export function findChapterIndexByFile(units: ChapterUnit[], filePath: string): number {
  let chapterIndex = 0;
  units.forEach((unit, index) => {
    if (unit.files.some((f) => f === filePath || f.includes(filePath))) {
      chapterIndex = index;
    }
  });
  return chapterIndex;
}

/** 在章节中查找文件索引 */
export function findFileIndexInChapter(chapter: ChapterUnit, filePath: string): number {
  const index = chapter.files.findIndex((f) => f === filePath || f.includes(filePath));
  return index >= 0 ? index : 0;
}

// ==================== 流式读取文本 ====================

interface StreamCallbacks {
  onParagraphs: (paragraphs: string[]) => void;
  onComplete: () => void;
  onError: () => void;
}

/** 流式读取文本 */
export async function streamReadText(url: string, callbacks: StreamCallbacks) {
  const { onParagraphs, onComplete, onError } = callbacks;

  try {
    const res = await fetch(url);
    if (!res.body) throw new Error("No body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 按换行拆分段落
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      const newParagraphs = lines.map((line) => line.trim()).filter((line) => line.length > 0);

      if (newParagraphs.length > 0) {
        onParagraphs(newParagraphs);
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      onParagraphs([buffer.trim()]);
    }

    onComplete();
  } catch (error) {
    console.error("Failed to stream read text:", error);
    onError();
  }
}

// ==================== 虚拟列表计算 ====================

interface VirtualListConfig {
  scrollTop: number;
  containerHeight: number;
  itemHeight: number;
  totalItems: number;
  overscan?: number;
}

interface VirtualListResult {
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
}

/** 计算虚拟列表渲染范围 */
export function calculateVirtualList({
  scrollTop,
  containerHeight,
  itemHeight,
  totalItems,
  overscan = 3,
}: VirtualListConfig): VirtualListResult {
  const totalHeight = totalItems * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(totalItems, startIndex + visibleItems);
  const offsetY = startIndex * itemHeight;

  return {
    totalHeight,
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
  };
}

// ==================== 进度计算 ====================

/** 计算阅读进度 */
export function calculateProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  if (maxScroll <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / maxScroll) * 100));
}

/** 根据进度计算滚动位置 */
export function calculateScrollTopFromProgress(
  progress: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  if (progress >= 100) return maxScroll;
  return (progress / 100) * maxScroll;
}
