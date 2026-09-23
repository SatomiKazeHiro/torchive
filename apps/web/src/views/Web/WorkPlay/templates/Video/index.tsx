import { useState, useMemo } from "react";
import { BiFolder } from "react-icons/bi";

import { transformEntities } from "@/mappers/work";
import { getFileName } from "@/utils/fileHelper";
import { Button, Empty } from "@/components";
import ArtPlayerVideo from "./ArtPlayerVideo";
import VideoEpisodeList from "./VideoEpisodeList";
import { generateVideoTabs } from "./videoTabs";
import { useVideoPlayState } from "./useVideoPlayState";
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
  initialFilePath,
}: MixturePlayTemplateProps) {
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

  // URL state: ?tab=&asset= 双向同步
  const { currentTab, currentAsset, setTab, setAsset } = useVideoPlayState(
    videoTabs,
    initialFilePath,
  );

  // 当前 tab 的视频列表
  const currentTabVideos = useMemo(() => {
    const tab = videoTabs.find((t) => t.key === currentTab);
    return tab?.videos || [];
  }, [videoTabs, currentTab]);

  // 当前播放的视频
  const currentVideo = currentAsset ?? undefined;

  // 作品信息
  const work = transformedWorkData?.work;
  const title = work?.detail?.title || work?.work || "未命名作品";
  const intro = work?.detail?.intro;
  const updateTime = work?.detail?.update_time
    ? new Date(work.detail.update_time).toLocaleDateString()
    : "";

  // 处理集数点击
  const handleEpisodeClick = (asset: string) => {
    setAsset(asset);
  };

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setTab(key);
  };

  // 处理重播
  const handleReplay = () => {
    // 重播当前视频，ArtPlayerVideo 组件内部处理
  };

  // 处理下一集
  const handleNextEpisode = () => {
    if (!currentAsset) return;
    const idx = currentTabVideos.indexOf(currentAsset);
    if (idx >= 0 && idx < currentTabVideos.length - 1) {
      setAsset(currentTabVideos[idx + 1]);
    }
  };

  // 是否有下一个视频
  const hasNextVideo = (() => {
    if (!currentAsset) return false;
    const idx = currentTabVideos.indexOf(currentAsset);
    return idx >= 0 && idx < currentTabVideos.length - 1;
  })();

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
        <Empty
          bordered
          size="lg"
          className="w-full max-w-sm shadow-2xs"
          icon={<BiFolder className="h-6 w-6" />}
          description={error || "作品不存在"}
        >
          <Button variant="primary" onClick={onRetry}>
            重试
          </Button>
        </Empty>
      </div>
    );
  }

  // 无视频数据
  if (!currentVideo) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Empty
          bordered
          size="lg"
          className="w-full max-w-sm shadow-2xs"
          icon={<BiFolder className="h-6 w-6" />}
          description="暂无视频内容"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 bg-white p-3 dark:bg-zinc-950">
      {/* 左侧：视频播放器 */}
      <div className="relative flex-1 overflow-hidden rounded-lg border border-zinc-200 shadow-2xs dark:border-zinc-800">
        <ArtPlayerVideo
          src={currentVideo}
          fileName={getFileName(currentVideo)}
          allFiles={allFiles}
          hasNext={hasNextVideo}
          onReplay={handleReplay}
          onPlayNext={handleNextEpisode}
          onPlaying={setIsPlaying}
        />
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
          activeTab={currentTab ?? ""}
          currentAsset={currentAsset}
          isPlaying={isPlaying}
          onTabChange={handleTabChange}
          onAssetSelect={handleEpisodeClick}
        />

        {/* 更多推荐 */}
        <MoreRecommendations domain={domain} recommendedWorks={recommendedWorks} />
      </div>
    </div>
  );
}
