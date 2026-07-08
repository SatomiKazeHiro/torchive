// Video 模板组件导出
export { default } from "./index.tsx";
export { default as VideoPlayTemplate } from "./index.tsx";

// 子组件导出
export { default as ArtPlayerVideo } from "./ArtPlayerVideo";
export { default as VideoEpisodeList } from "./VideoEpisodeList";
export { default as BreadcrumbNav } from "./BreadcrumbNav";
export { default as WorkInfo } from "./WorkInfo";
export { default as MoreRecommendations } from "./MoreRecommendations";

// EndScreen 相关导出
export { EndScreen } from "./EndScreen";
export type { EndScreenProps } from "./EndScreen";
export { EndScreenManager } from "./EndScreenManager";
export type { EndScreenManagerConfig } from "./EndScreenManager";

// 类型导出
export type { Danmu, Mode } from "./types";
export type { VideoEpisodeListProps } from "./VideoEpisodeList";
export type { VideoTab } from "./videoTabs";
export type { BreadcrumbNavProps } from "./BreadcrumbNav";
export type { WorkInfoProps } from "./WorkInfo";
export type { MoreRecommendationsProps } from "./MoreRecommendations";

// 工具函数导出
export { navigateToWorkDetailByWork } from "@/utils/navigation";
export { mapWorkToBrief } from "@/mappers/work";
