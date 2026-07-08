import type { ReactNode } from "react";
import { BiSearch } from "react-icons/bi";

export interface AdminEmptyStateProps {
  /** 主标题，如"暂无匹配主题" */
  title: string;
  /** 副标题/提示文本 */
  hint?: string;
  /** 可选的额外内容（通常是清除筛选按钮） */
  action?: ReactNode;
}

/**
 * Admin 列表通用空状态：圆形搜索图标 + 主标题 + 提示文案 + 可选 CTA。
 * 主题色由 bg-ghost-gray / text-rich-black / text-midtone-gray 承载。
 */
export function AdminEmptyState({ title, hint, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-[9999px] bg-ghost-gray text-rich-black dark:bg-zinc-800 dark:text-zinc-300">
        <BiSearch className="text-2xl" />
      </div>
      <p className="mt-4 text-sm font-medium text-rich-black dark:text-zinc-100">{title}</p>
      {hint && <p className="mt-1 text-xs text-midtone-gray dark:text-zinc-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default AdminEmptyState;