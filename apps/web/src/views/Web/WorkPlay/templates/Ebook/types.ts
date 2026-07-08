import type { EntitiesJson } from "@/types/db-instance";

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

// 阅读进度记录
export interface ReadingProgress {
  workId: string;
  chapterIndex: number;
  fileIndex: number;
  progress: number;
  scrollTop: number;
  lastReadTime: number;
}

// 主题模式
export type ThemeMode = "paper" | "parchment" | "dark";

// 字体大小
export type FontSize = "small" | "medium" | "large" | "xlarge";

// 阅读模式
export type ReadingMode = "page" | "scroll";

// 组件 Props
export interface EbookPlayTemplateProps {
  transformedWorkData: {
    work: Work;
    entities: EntitiesJson;
  } | null;
  domain: string;
  category: string;
  domainName: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  recommendedWorks: Work[];
}

// 设置面板 Props
export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  fontSize: FontSize;
  readingMode: ReadingMode;
  currentChapterIndex: number;
  chapterUnits: ChapterUnit[];
  fileExtension?: string;
  onThemeChange: (theme: ThemeMode) => void;
  onFontSizeChange: (size: FontSize) => void;
  onReadingModeChange: (mode: ReadingMode) => void;
  onChapterSelect: (index: number) => void;
}