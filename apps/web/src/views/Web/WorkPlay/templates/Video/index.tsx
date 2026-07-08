import { useState, useMemo } from "react";
import { BiFolder } from "react-icons/bi";

import { transformEntities } from "@/mappers/work";
import { getFileName } from "@/utils/fileHelper";
import { Button } from "@/components";
import ArtPlayerVideo from "./ArtPlayerVideo";
import VideoEpisodeList from "./VideoEpisodeList";
import { generateVideoTabs } from "./videoTabs";
import BreadcrumbNav from "./BreadcrumbNav";
import WorkInfo from "./WorkInfo";
import MoreRecommendations from "./MoreRecommendations";

import type { EntitiesJson } from "@/types/db-instance";
import type { MixturePlayTemplateProps } from "../Mixture/types";

/**
 * Video 播放模板
 *
 * 布局：
 * - 左侧：视频播放器（占据主要空间）
 * - 右侧：作品信息 + Tabs选集 + 更多推荐
 *
 * 风格：现代简约扁平风格
 */
export default function VideoPlayTemplate({
  transformedWorkData,
  domain,
  category,
  domainName,
  loading,
  error,
  onRetry,
  recommendedWorks,
}: MixturePlayTemplateProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 解析实体数据
  const entities = useMemo(() => {
    if (!transformedWorkData?.work) {
      return { assets: [], section: [], orphanAssets: [] } as EntitiesJson;
    }
    return transformEntities(transformedWorkData.work);
  }, [transformedWorkData]);

  // 生成视频 tabs（用于获取当前播放视频）
  const videoTabs = useMemo(() => generateVideoTabs(entities), [entities]);

  // 收集所有文件列表（用于字幕检测）
  const allFiles = useMemo(() => {
    const files: string[] = [];
    files.push(...entities.assets);
    entities.section.forEach((sec) => files.push(...sec.files));
    files.push(...entities.orphanAssets);
    return files;
  }, [entities]);

  // 获取当前 tab 的视频列表
  const currentTabKey = activeTab || videoTabs[0]?.key || "";
  const currentTabVideos = useMemo(() => {
    const tab = videoTabs.find((t) => t.key === currentTabKey);
    return tab?.videos || [];
  }, [videoTabs, currentTabKey]);

  // 当前播放的视频
  const currentVideo = currentTabVideos[currentVideoIndex] || currentTabVideos[0];

  // 作品信息
  const work = transformedWorkData?.work;
  const title = work?.detail?.title || work?.work || "未命名作品";
  const intro = work?.detail?.intro;
  const updateTime = work?.detail?.update_time
    ? new Date(work.detail.update_time).toLocaleDateString()
    : "";

  // 处理集数点击
  const handleEpisodeClick = (index: number) => {
    setCurrentVideoIndex(index);
  };

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentVideoIndex(0);
  };

  // 处理重播
  const handleReplay = () => {
    // 重播当前视频，ArtPlayerVideo 组件内部处理
  };

  // 处理下一集
  const handleNextEpisode = () => {
    if (currentVideoIndex < currentTabVideos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    }
  };

  // 是否有下一个视频
  const hasNextVideo = currentVideoIndex < currentTabVideos.length - 1;

  // 加载中状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-800 dark:border-t-zinc-400" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !work) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white py-12 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <BiFolder className="mx-auto mb-4 h-12 w-12 text-zinc-200 dark:text-zinc-800" />
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{error || "作品不存在"}</p>
          <Button variant="primary" onClick={onRetry}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  // 无视频数据
  if (!currentVideo) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white py-12 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <BiFolder className="mx-auto mb-4 h-12 w-12 text-zinc-200 dark:text-zinc-800" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无视频内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 bg-white p-3 dark:bg-zinc-950">
      {/* 左侧：视频播放器 */}
      <div className="relative flex-1 overflow-hidden rounded-lg border border-zinc-200 shadow-2xs dark:border-zinc-800">
        {currentVideo ? (
          <ArtPlayerVideo
            src={currentVideo}
            fileName={getFileName(currentVideo)}
            allFiles={allFiles}
            hasNext={hasNextVideo}
            onReplay={handleReplay}
            onPlayNext={handleNextEpisode}
            onPlaying={setIsPlaying}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
            <BiFolder className="h-16 w-16 text-zinc-200 dark:text-zinc-800" />
            <p className="text-zinc-400">请选择要播放的视频</p>
          </div>
        )}
      </div>

      {/* 右侧：作品信息 + Tabs选集 + 更多推荐 */}
      <div className="flex h-full w-80 shrink-0 flex-col gap-3 xl:w-96">
        {/* 面包屑导航 */}
        <BreadcrumbNav domain={domain} category={category} domainName={domainName} work={work} />

        {/* 作品信息区域 */}
        <WorkInfo title={title} intro={intro} updateTime={updateTime} category={category} />

        {/* Tabs 选集区域 */}
        <VideoEpisodeList
          entities={entities}
          activeTab={activeTab}
          currentVideoIndex={currentVideoIndex}
          isPlaying={isPlaying}
          onTabChange={handleTabChange}
          onVideoSelect={handleEpisodeClick}
        />

        {/* 更多推荐 */}
        <MoreRecommendations domain={domain} recommendedWorks={recommendedWorks} />
      </div>
    </div>
  );
}
