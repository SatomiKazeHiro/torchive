import type { EntitiesJson } from "@/types/db-instance";
import type { ViewerProps } from "../types";

// 重新导出 ViewerProps 以保持 Mixture 内部组件的导入路径稳定
export type { ViewerProps };

// 媒体文件类型
export type MediaType = "image" | "video" | "audio" | "pdf" | "text" | "unknown";

// 文件项
export interface FileItem {
  path: string;
  type: "assets" | "section" | "orphanAssets";
  sectionName?: string;
}

// 分组项（手风琴）
export interface SectionItem {
  key: string;
  type: "assets" | "section" | "orphanAssets";
  label: string;
  files: string[];
  sectionName?: string;
  order: number;
}

// 音频播放器扩展 Props
export interface AudioPlayerProps extends ViewerProps {
  /** 是否有上一首 */
  hasPrev?: boolean;
  /** 是否有下一首 */
  hasNext?: boolean;
  /** 切换到上一首 */
  onPrev?: () => void;
  /** 切换到下一首 */
  onNext?: () => void;
}

// 歌词行类型
export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

// 网易云音乐搜索结果
export interface SongResult {
  id: number;
  name: string;
  artists: { name: string }[];
  album: { name: string };
}

// 歌词显示模式
export type LyricMode = "both" | "original" | "translation";
// 歌词字体大小
export type LyricFontSize = "small" | "medium" | "large";
// 封面类型
export type CoverType = "vinyl" | "square";
// 封面尺寸
export type CoverSize = "sm" | "md" | "lg";

// 播放器状态
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// 转换后的作品数据
export interface TransformedWorkData {
  /** 原始作品数据 */
  work: Work;
  /** 处理后的 entities（包含完整路径） */
  entities: EntitiesJson;
}

// Mixture 模板 Props
export interface MixturePlayTemplateProps {
  /** 转换后的作品数据（包含处理后的 entities） */
  transformedWorkData: TransformedWorkData | null;
  /** 当前域名 */
  domain: string;
  /** 当前分类 */
  category: string;
  /** 域名显示名称 */
  domainName: string;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重试回调 */
  onRetry: () => void;
  /** 初始文件路径（可选） */
  initialFilePath?: string;
  /** 推荐作品列表 */
  recommendedWorks: Work[];
}
