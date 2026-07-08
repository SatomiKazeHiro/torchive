import { Link } from "react-router-dom";
import { BiPlay, BiTrash } from "react-icons/bi";
import { cn } from "@/components/utils/common";

import { generateCoverUrl } from "@/mappers/work";

interface TimelineWorkCardProps {
  work?: Work;
  workHashId: string;
  extraInfo?: React.ReactNode;
  onDelete?: () => void;
  actionLabel?: string;
  linkState?: Record<string, unknown>;
}

export default function TimelineWorkCard({
  work,
  workHashId,
  extraInfo,
  onDelete,
  actionLabel = "查看详情",
  linkState,
}: TimelineWorkCardProps) {
  const detail = work?.detail;
  const title = detail?.title || detail?.name || workHashId;
  const cover = work && generateCoverUrl(work);
  const domain = work?.domain;
  const category = work?.category;
  const hasLink = !!domain && !!category;
  const linkTo = hasLink ? `/${domain}/${category}/${workHashId}` : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-transparent bg-card p-2 transition-all",
        "hover:border-edge hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)]",
      )}
    >
      {/* 封面 */}
      {hasLink ? (
        <Link
          to={linkTo!}
          state={linkState}
          className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-subtle"
        >
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BiPlay size={24} className="text-faint" />
            </div>
          )}
          {/* 右下角角标（域名） */}
          {domain && (
            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {domain}
            </div>
          )}

          {/* 悬停遮罩 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100">
              <BiPlay size={14} />
              {actionLabel}
            </div>
          </div>
        </Link>
      ) : (
        <div className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-subtle">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BiPlay size={24} className="text-faint" />
            </div>
          )}
          {domain && (
            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {domain}
            </div>
          )}
        </div>
      )}

      {/* 信息 */}
      <div className="mt-1 flex flex-1 flex-col">
        {hasLink ? (
          <Link
            to={linkTo!}
            state={linkState}
            className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors hover:text-accent"
            title={title}
          >
            {title}
          </Link>
        ) : (
          <span
            className="line-clamp-2 text-sm font-semibold leading-snug text-primary"
            title={title}
          >
            {title}
          </span>
        )}

        <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
          <div className="flex-1 truncate pr-2">{extraInfo}</div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
              title="删除"
            >
              <BiTrash size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
