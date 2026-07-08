/**
 * PdfReader 组件类型定义
 */

// 阅读模式
export type ReadingMode = "page" | "scroll";

// PDF 阅读器主题（双主题：明亮、暗黑）
export type PdfThemeMode = "light" | "dark";

// 章节单元数据
export interface ChapterUnit {
  key: string;
  name: string;
  files: string[];
  cover: string | null;
}

// PdfReader Props
export interface PdfReaderProps {
  /** 文件地址 */
  src: string;
  /** 文件名 */
  fileName: string;
  /** 标题 */
  title?: string;
  /** 主题模式 */
  themeMode?: PdfThemeMode;
  /** 阅读模式 */
  readingMode?: ReadingMode;
  /** 缩放比例 */
  scale?: number;
  /** 章节单元列表 */
  chapterUnits?: ChapterUnit[];
  /** 当前章节索引 */
  currentChapterIndex?: number;
  /** 是否第一章 */
  isFirstChapter?: boolean;
  /** 是否最后一章 */
  isLastChapter?: boolean;
  /** 返回回调 */
  onBack?: () => void;
  /** 进度变化回调 (0-100) */
  onProgressChange?: (progress: number) => void;
  /** 主题变化回调 */
  onThemeChange?: (theme: PdfThemeMode) => void;
  /** 阅读模式变化回调 */
  onReadingModeChange?: (mode: ReadingMode) => void;
  /** 缩放变化回调 */
  onScaleChange?: (scale: number) => void;
  /** 上一章回调 */
  onPrevChapter?: () => void;
  /** 下一章回调 */
  onNextChapter?: () => void;
}

// PdfReader Ref
export interface PdfReaderRef {
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 跳转到指定页 */
  goToPage: (page: number) => void;
  /** 上一页 */
  prevPage: () => void;
  /** 下一页 */
  nextPage: () => void;
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
}
