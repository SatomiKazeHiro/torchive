import { useState, useMemo, useEffect } from "react";
import { BiGridAlt, BiListUl, BiPlay } from "react-icons/bi";
import InPlaying from "@/features/common/InPlaying";

import { Tabs } from "@/components";
import { getFileDisplayName } from "@/utils/fileHelper";
import { generateVideoTabs } from "./videoTabs";

import type { EntitiesJson } from "@/types/db-instance";

export interface VideoEpisodeListProps {
  /** 视频实体数据 */
  entities: EntitiesJson;
  /** 当前激活的 tab */
  activeTab: string;
  /** 当前视频索引 */
  currentVideoIndex: number;
  /** 视频是否播放重 */
  isPlaying: boolean;
  /** Tab 切换回调 */
  onTabChange: (key: string) => void;
  /** 视频选择回调 */
  onVideoSelect: (index: number) => void;
}

/**
 * 视频选集列表组件
 */
export default function VideoEpisodeList({
  entities,
  activeTab,
  currentVideoIndex,
  isPlaying,
  onTabChange,
  onVideoSelect,
}: VideoEpisodeListProps) {
  const [layoutType, setLayoutType] = useState<"grid" | "list">("list");
  const [internalActiveTab, setInternalActiveTab] = useState<string>(activeTab);

  // 生成视频 tabs
  const videoTabs = useMemo(() => generateVideoTabs(entities), [entities]);

  // 同步外部 activeTab
  useEffect(() => {
    if (activeTab) {
      setInternalActiveTab(activeTab);
    } else if (videoTabs.length > 0 && !internalActiveTab) {
      setInternalActiveTab(videoTabs[0].key);
    }
  }, [activeTab, videoTabs, internalActiveTab]);

  // 处理 tab 切换
  const handleTabChange = (key: string) => {
    setInternalActiveTab(key);
    onTabChange(key);
  };

  // 获取当前 tab 的视频列表
  const currentTabKey = internalActiveTab || videoTabs[0]?.key || "";

  // 如果没有数据，不渲染
  if (videoTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <Tabs
        type="line"
        size="sm"
        activeKey={currentTabKey}
        onChange={handleTabChange}
        className="h-full"
        tabBarClassName="px-3 pt-2 border-b border-zinc-100 dark:border-zinc-800"
        contentClassName="p-0 overflow-y-auto"
        tabBarExtraContent={
          <div className="flex items-center gap-1">
            {/* 布局切换按钮 */}
            <button
              onClick={() => setLayoutType(layoutType === "grid" ? "list" : "grid")}
              className={`rounded p-1.5 transition-colors ${
                layoutType === "grid"
                  ? "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
              title={layoutType === "grid" ? "切换为列表布局" : "切换为网格布局"}
            >
              {layoutType === "grid" ? (
                <BiGridAlt className="h-4 w-4" />
              ) : (
                <BiListUl className="h-4 w-4" />
              )}
            </button>
          </div>
        }
        items={videoTabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <div className="p-3">
              {/* 集数列表/网格 */}
              <div
                className={layoutType === "grid" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-1"}
              >
                {tab.videos.map((video, index) => {
                  const isActive = currentTabKey === tab.key && currentVideoIndex === index;
                  const displayName = getFileDisplayName(video);

                  return (
                    <button
                      key={`${video}-${index}`}
                      onClick={() => onVideoSelect(index)}
                      title={getFileDisplayName(video, 100)}
                      className={`relative flex items-center justify-start gap-2 rounded-md border px-2 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                      } `}
                    >
                      {isActive && (isPlaying ? <InPlaying /> : <BiPlay className="h-3 w-3" />)}
                      <div
                        className={`flex min-w-0 items-center ${
                          layoutType === "grid" ? "w-full flex-col" : "flex-1 flex-row gap-2"
                        }`}
                      >
                        <span
                          className={`truncate text-xs ${
                            layoutType === "grid" ? "w-full text-center" : "flex-1 text-left"
                          }`}
                        >
                          {displayName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        }))}
      />
    </div>
  );
}
