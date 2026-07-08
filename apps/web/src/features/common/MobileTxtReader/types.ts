/**
 * MobileTxtReader 组件类型定义
 * 
 * 移动端 TXT 阅读器 - 点击切换导航栏模式
 */

// 主题模式
export type ThemeMode = "paper" | "parchment" | "dark";

// 字体大小
export type FontSize = "small" | "medium" | "large" | "xlarge";

// 章节单元数据
export interface ChapterUnit {
  key: string;
  name: string;
  files: string[];
  cover: string | null;
}

// 目录项
export interface TocItem {
  id: number;
  title: string;
  level: number;
  paragraphIndex: number;
}

// 搜索结果项
export interface SearchResult {
  id: number;
  paragraphIndex: number;
  content: string;
  matches: Array<{ start: number; end: number }>;
}

// 搜索状态
export interface SearchState {
  keyword: string;
  results: SearchResult[];
  currentResultIndex: number;
  isSearching: boolean;
}

// 段落数据
export interface Paragraph {
  id: number;
  content: string;
}

// 跳转提示信息
export interface JumpBackInfo {
  scrollTop: number;
  progress: number;
  timestamp: number;
}

// MobileTxtReader Props
export interface MobileTxtReaderProps {
  /** 文件地址 */
  src: string;
  /** 文件名 */
  fileName: string;
  /** 标题 */
  title?: string;
  /** 主题模式 */
  themeMode?: ThemeMode;
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
  onThemeChange?: (theme: ThemeMode) => void;
  /** 字体大小变化回调 */
  onFontSizeChange?: (size: FontSize) => void;
  /** 上一章回调 */
  onPrevChapter?: () => void;
  /** 下一章回调 */
  onNextChapter?: () => void;
  /** 打开设置面板回调 */
  onOpenSettings?: () => void;
}

// MobileTxtReader Ref
export interface MobileTxtReaderRef {
  /** 当前进度百分比 */
  progress: number;
  /** 跳转到指定进度 */
  goToProgress: (progress: number) => void;
  /** 增大字体 */
  increaseFontSize: () => void;
  /** 减小字体 */
  decreaseFontSize: () => void;
  /** 切换目录 */
  toggleToc: () => void;
  /** 切换搜索 */
  toggleSearch: () => void;
  /** 是否有目录 */
  hasToc: () => boolean;
  /** 搜索是否打开 */
  isSearchOpen: () => boolean;
  /** 目录是否打开 */
  isTocOpen: () => boolean;
  /** 关闭搜索 */
  closeSearch: () => void;
  /** 关闭目录 */
  closeToc: () => void;
  /** 切换导航栏 */
  toggleNav: () => void;
}
