import type { EntitiesJson } from "@/types/db-instance";

// 图片项
export interface ImageItem {
  path: string;
  name: string;
}

// 组件 Props
export interface AlbumPlayTemplateProps {
  /** 转换后的作品数据（包含处理后的 entities） */
  transformedWorkData: {
    work: Work;
    entities: EntitiesJson;
  } | null;
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
}

// 缩略图项 Props
export interface ThumbnailItemProps {
  src: string;
  alt: string;
  isActive: boolean;
  /** 是否有任意一项被选中（用于淡化未选中项以突出焦点） */
  hasActive: boolean;
  onClick: () => void;
  index: number;
}
