/**
 * TxtReader 组件类型定义
 */

// 阅读模式
export type ReadingMode = "page" | "scroll";

// TXT 阅读器主题（三主题：纸质、羊皮纸、暗黑）
export type TxtThemeMode = "paper" | "parchment" | "dark";

// 字体大小
export type FontSize = "small" | "medium" | "large" | "xlarge";

// 章节单元数据
export interface ChapterUnit {
  key: string;
  name: string;
  files: string[];
  cover: string | null;
}

// 目录项（基于内容生成的章节）
export interface TocItem {
  id: number; // 段落ID
  title: string; // 章节标题
  level: number; // 层级（1=大章，2=小节）
  paragraphIndex: number; // 段落索引
}

// 搜索结果项
export interface SearchResult {
  id: number; // 段落ID
  paragraphIndex: number; // 段落索引
  content: string; // 段落内容预览
  matches: Array<{ start: number; end: number }>; // 匹配位置
}

// 搜索状态
export interface SearchState {
  keyword: string; // 搜索关键词
  results: SearchResult[]; // 搜索结果
  currentResultIndex: number; // 当前浏览的结果索引
  isSearching: boolean; // 是否正在搜索
}

// 段落数据
export interface Paragraph {
  id: number;
  content: string;
}

// 跳转提示信息
export interface JumpBackInfo {
  scrollTop: number; // 跳转前的滚动位置
  progress: number; // 跳转前的进度
  timestamp: number; // 跳转时间
}

// TxtReader Props - 与 PdfReader 保持一致的接口设计
export interface TxtReaderProps {
  /** 文件地址 */
  src: string;
  /** 文件名 */
  fileName: string;
  /** 标题 */
  title?: string;
  /** 主题模式 */
  themeMode?: TxtThemeMode;
  /** 阅读模式 */
  readingMode?: ReadingMode;
  /** 字体大小 */
  fontSize?: FontSize;
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
  onThemeChange?: (theme: TxtThemeMode) => void;
  /** 阅读模式变化回调 */
  onReadingModeChange?: (mode: ReadingMode) => void;
  /** 字体大小变化回调 */
  onFontSizeChange?: (size: FontSize) => void;
  /** 上一章回调 */
  onPrevChapter?: () => void;
  /** 下一章回调 */
  onNextChapter?: () => void;
}

// TxtReader Ref
export interface TxtReaderRef {
  /** 当前进度百分比 */
  progress: number;
  /** 跳转到指定进度 */
  goToProgress: (progress: number) => void;
  /** 增大字体 */
  increaseFontSize: () => void;
  /** 减小字体 */
  decreaseFontSize: () => void;
}
