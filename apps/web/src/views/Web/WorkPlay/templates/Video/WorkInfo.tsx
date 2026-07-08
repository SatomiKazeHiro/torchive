import { BiCalendar } from "react-icons/bi";

export interface WorkInfoProps {
  /** 作品标题 */
  title: string;
  /** 作品简介 */
  intro?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 分类 */
  category: string;
}

/**
 * 作品信息区域组件
 */
export default function WorkInfo({ title, intro, updateTime, category }: WorkInfoProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* 标题 */}
      <h1 className="mb-2 text-lg leading-tight font-semibold text-zinc-900 dark:text-white">
        {title}
      </h1>

      {/* 标签区域 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {/* 更新时间 */}
        {updateTime && (
          <span className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <BiCalendar className="h-3 w-3" />
            {updateTime}
          </span>
        )}
        {/* 分类标签 */}
        <span className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {category}
        </span>
      </div>

      {/* 简介 */}
      {intro && (
        <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {intro}
        </p>
      )}
    </div>
  );
}
