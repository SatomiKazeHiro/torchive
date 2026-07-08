import type { TransformedWorkData } from "../Mixture";

// 布局模式（仅支持左右）
export type LayoutMode = "left-right" | "right-left";

// 音乐播放模板 Props
export interface MusicPlayTemplateProps {
  /** 转换后的作品数据 */
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

// 播放列表项
export interface PlaylistItem {
  /** 唯一标识 */
  id: string;
  /** 文件路径 */
  path: string;
  /** 文件名 */
  fileName: string;
  /** 所属章节 */
  section?: string;
  /** 序号 */
  index: number;
}

// 歌词行类型
export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

// 歌词显示模式
export type LyricMode = "both" | "original" | "translation";

// 歌词字体大小
export type LyricFontSize = "small" | "medium" | "large";

// 播放状态
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// 歌词来源
export type LyricSource = "embedded" | "network" | "none";
