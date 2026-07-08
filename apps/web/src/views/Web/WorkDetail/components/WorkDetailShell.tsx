import { ReactNode, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiCalendar } from "react-icons/bi";

import { Breadcrumb, Button } from "@/components";
import { buildBreadcrumbItems } from "@/views/Web/utils/breadcrumb";
import { mapWorkToBrief } from "@/mappers/work";

import FavoriteActionBtn from "./FavoriteActionBtn";
import WatchLaterActionBtn from "./WatchLaterActionBtn";

interface WorkDetailShellProps {
  work: Work;
  domain: string;
  category: string;
  domainName: string;
  /** 自定义封面节点（Poster / VinylCover / ...） */
  cover: ReactNode;
  /** 主操作按钮文案（"立即播放" / "开始阅读" / "查看详情" 等） */
  primaryLabel: string;
  /** 中部内容：Tabs / 章节列表 / 自定义 */
  children: ReactNode;
}

export default function WorkDetailShell({
  work,
  domain,
  category,
  domainName,
  cover,
  primaryLabel,
  children,
}: WorkDetailShellProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 预计算 workBrief，避免消费方重复 useMemo
  useMemo(() => mapWorkToBrief(work), [work]);

  const title = work.detail?.title || work.work;
  const intro = work.detail?.intro || "暂无简介";
  const updateTime = work.detail?.update_time
    ? new Date(work.detail.update_time).toLocaleDateString()
    : "";

  const handlePrimary = () => {
    navigate(`/${domain}/${category}/${id}/play`);
  };

  return (
    <>
      {/* ==================== 上部：作品信息区域 ==================== */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-start gap-8 md:flex-row md:gap-12">
            <div className="z-10 mx-auto shrink-0 md:mx-0">{cover}</div>

            <div className="z-10 flex min-w-0 flex-1 flex-col justify-center text-center md:text-left">
              <h1 className="mb-4 text-2xl leading-tight font-semibold tracking-tight text-slate-900 md:text-3xl dark:text-white">
                {title}
              </h1>

              <Breadcrumb
                items={buildBreadcrumbItems({ domain, category, domainName })}
                className="mb-4 border-0 bg-transparent px-0 py-0 text-slate-500 shadow-none dark:text-slate-400"
              />

              {/* 标签区域 - 预留 */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2 md:justify-start" />

              {intro && intro !== "暂无简介" && (
                <p className="mb-6 line-clamp-3 max-w-3xl text-[14px] leading-relaxed text-slate-600 md:line-clamp-4 md:text-justify dark:text-slate-400">
                  {intro}
                </p>
              )}

              {updateTime && (
                <div className="mb-8 flex items-center justify-center gap-1.5 text-[13px] text-slate-500 md:justify-start dark:text-slate-400">
                  <BiCalendar className="h-4 w-4" />
                  <span>更新于 {updateTime}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Button variant="primary" size="md" onClick={handlePrimary}>
                  {primaryLabel}
                </Button>
                <FavoriteActionBtn work={work} />
                <WatchLaterActionBtn work={work} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 中部：内容区域 ==================== */}
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </>
  );
}