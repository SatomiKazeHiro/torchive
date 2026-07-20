import { Link, useNavigate } from "react-router-dom";
import { mapWorkToBrief } from "@/mappers/work";
import { Card, Button, Breadcrumb, Poster, Empty } from "@/components";
import { buildBreadcrumbItems } from "@/views/Web/utils/breadcrumb";
import { navigateToWorkDetailByWork } from "@/utils/navigation";
import {
  BiFile,
  BiFolder,
  BiHeart,
  BiSolidHeart,
  BiBookmark,
  BiSolidBookmark,
  BiCollection,
  BiExpand,
  BiCollapse,
} from "react-icons/bi";
import FavoriteAction from "@/features/user-library/FavoriteAction";
import WatchLaterAction from "@/features/user-library/WatchLaterAction";

import FileViewer from "./FileViewer";
import AccordionSection from "./AccordionSection";
import { useMixtureState } from "./hooks";
import type { MixturePlayTemplateProps } from "./types";

/**
 * Mixture 播放器模板
 *
 * 功能特性：
 * - 左侧：文件查看器（图片、视频、音频、PDF、文本等）
 * - 右侧：面包屑导航、章节手风琴、推荐作品
 * - 支持文件导航（上一首/下一首）
 * - 支持全宽/居中模式切换
 *
 * 状态管理：
 * - 使用 useMixtureState Hook 集中管理状态
 * - 使用 ahooks 的 useSet 管理展开章节
 * - 使用 ahooks 的 useToggle 管理 UI 开关
 */
export default function MixturePlayTemplate({
  transformedWorkData,
  domain,
  category,
  domainName,
  loading,
  error,
  onRetry,
  initialFilePath,
  recommendedWorks,
}: MixturePlayTemplateProps) {
  const navigate = useNavigate();

  // 使用自定义 Hook 管理状态
  const {
    work,
    sectionItems,
    currentFilePath,
    currentFileIndex,
    currentFileList,
    expandedKeys,
    handleToggleSection,
    isFullWidth,
    toggleFullWidth,
    goToPrev,
    goToNext,
    hasMultipleFiles,
    title,
    containerClass,
    setCurrentFilePath,
  } = useMixtureState({ transformedWorkData, initialFilePath });

  // 处理文件点击 - 直接切换到对应文件
  const handleFileClick = (filePath: string) => {
    setCurrentFilePath(filePath);
  };

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
        <Card className="w-full max-w-sm py-12 text-center" bordered={false} shadow="sm">
          <BiFile className="mx-auto mb-4 h-12 w-12 text-zinc-200 dark:text-zinc-800" />
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{error || "作品不存在"}</p>
          <Button variant="primary" onClick={onRetry}>
            重试
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      id="play-page"
      className={`${containerClass} flex h-full gap-3 bg-white p-3 dark:bg-zinc-950`}
    >
      {/* 左侧：查看器 */}
      <div className="relative flex-1 overflow-hidden rounded-lg border border-zinc-200 shadow-2xs dark:border-zinc-800">
        {currentFilePath ? (
          <FileViewer
            filePath={currentFilePath}
            hasPrev={currentFileIndex > 0}
            hasNext={currentFileIndex < currentFileList.length - 1}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Empty
              size="md"
              iconVariant="flat"
              icon={<BiFolder className="text-faint h-16 w-16" />}
              description="暂无内容"
            />
          </div>
        )}
      </div>

      {/* 右侧：面包屑 + 文件列表 + 推荐 */}
      <div className="flex h-full w-72 shrink-0 flex-col gap-3 xl:w-80">
        {/* 面包屑导航 */}
        <Breadcrumb
          items={buildBreadcrumbItems({
            domain,
            category,
            domainName,
            workName: title,
            showHome: true,
            overviewLabel: "总览",
          })}
          extra={
            work && (
              <>
                <FavoriteAction
                  work={work}
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                  activeSlot={<BiSolidHeart className="h-4 w-4 text-red-500" />}
                  inactiveSlot={<BiHeart className="h-4 w-4" />}
                />
                <WatchLaterAction
                  work={work}
                  className="hover:text-deep-black rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  activeSlot={<BiSolidBookmark className="text-deep-black h-4 w-4" />}
                  inactiveSlot={<BiBookmark className="h-4 w-4" />}
                />
              </>
            )
          }
        />

        {/* 文件列表 */}
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <BiCollection className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white">文件列表</h3>
            </div>
            <span className="rounded-full border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800">
              {sectionItems.reduce((sum, item) => sum + item.files.length, 0)}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sectionItems.length === 0 ? (
              <Empty
                size="md"
                iconVariant="flat"
                icon={<BiFolder className="text-faint h-8 w-8" />}
                description="暂无数据"
              />
            ) : (
              <div className="h-full">
                {sectionItems.map((item) => (
                  <AccordionSection
                    key={item.key}
                    item={item}
                    isExpanded={expandedKeys.has(item.key)}
                    currentFilePath={currentFilePath}
                    onToggle={() => handleToggleSection(item.key)}
                    onFileClick={handleFileClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 推荐区域 */}
        {recommendedWorks.length > 0 && (
          <div className="shrink-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-900 dark:text-white">更多推荐</h3>
              <Link
                to={`/${domain}`}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                全部
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recommendedWorks.slice(0, 3).map((recWork) => {
                const brief = mapWorkToBrief(recWork);
                return (
                  <a
                    key={recWork.hash_id}
                    onClick={() => navigateToWorkDetailByWork(navigate, recWork)}
                    className="group block cursor-pointer"
                  >
                    <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50 transition-all group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
                      <Poster src={brief.cover} alt={brief.label} ratio="3/4" />
                    </div>
                    <p
                      className="mt-1 truncate text-xs text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                      title={brief.label}
                    >
                      {brief.label}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 当只有单个文件时，只显示全屏切换按钮（右下角，低透明度） */}
      {!hasMultipleFiles && (
        <button
          onClick={toggleFullWidth}
          className="fixed right-6 bottom-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-400/50 bg-zinc-800/80 text-white opacity-40 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-800 hover:opacity-100"
          title={isFullWidth ? "切换到居中模式" : "切换到全宽模式"}
        >
          {isFullWidth ? <BiCollapse className="h-4 w-4" /> : <BiExpand className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export type {
  MediaType,
  FileItem,
  SectionItem,
  ViewerProps,
  AudioPlayerProps,
  MixturePlayTemplateProps,
  TransformedWorkData,
  LyricLine,
  LyricMode,
  LyricFontSize,
  SongResult,
  CoverSize,
} from "./types";
