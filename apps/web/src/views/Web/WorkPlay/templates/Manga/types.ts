import type { EntitiesJson } from "@/types/db-instance";

// 阅读模式
type ReadingMode = "single" | "strip";

// 章节单元数据
interface ChapterUnit {
  key: string;
  name: string;
  files: string[];
  cover: string | null;
}

// 组件 Props
interface MangaPlayTemplateProps {
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
  /** 初始文件路径(从 PlayView 解析 URL ?asset= 后传入) */
  initialFilePath?: string;
}

// 懒加载图片组件 Props
interface LazyImageProps {
  src: string;
  alt: string;
  index: number;
  estimatedHeight: number;
  onHeightChange?: (height: number) => void;
  onVisible?: (index: number) => void;
  /** 加载优先级：0=当前页立即加载，1=预加载，2=普通懒加载 */
  priority?: number;
}

// 懒加载图片组件 Ref
interface LazyImageRef {
  scrollIntoView: (behavior?: ScrollBehavior) => void;
}

// 设置面板 Props
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ReadingMode;
  isAutoPlay: boolean;
  autoPlayInterval: number;
  currentChapterIndex: number;
  chapterUnits: ChapterUnit[];
  onModeChange: (mode: ReadingMode) => void;
  onIntervalChange: (value: number) => void;
  onChapterSelect: (index: number) => void;
}

// 工具栏 Props
interface ToolbarProps {
  isVisible: boolean;
  mode: ReadingMode;
  currentPage: number;
  totalPages: number;
  chapterUnits: ChapterUnit[];
  isFirstPage: boolean;
  isLastPage: boolean;
  isFirstChapter: boolean;
  isLastChapter: boolean;
  isAutoPlay: boolean;
  title: string;
  chapterName: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleAutoPlay: () => void;
}

export type {
  ReadingMode,
  ChapterUnit,
  MangaPlayTemplateProps,
  LazyImageProps,
  LazyImageRef,
  SettingsPanelProps,
  ToolbarProps,
};
