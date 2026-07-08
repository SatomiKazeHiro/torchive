import type { ComponentType, ReactNode } from "react";
import { cn } from "@/components/utils/common";

interface PageHeaderProps {
  /** 标题左侧图标，传入 react-icons 组件 */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** 主标题文本 */
  title: string;
  /** 副标题/描述（可选） */
  description?: ReactNode;
  /** 标题右侧计数 badge（可选），例如 "12 个内容" */
  count?: ReactNode;
  /** 标题右侧操作区，例如 "清空列表" 按钮（可选） */
  action?: ReactNode;
  /** 覆盖最外层容器（用于 Library 这类副标题换行的特殊布局） */
  layout?: "row" | "stacked";
  className?: string;
}

/**
 * 用户子页（收藏 / 历史 / 稍后再看 / 设置）共用的页面标题栏。
 * 浅/深色由 bg-card / text-primary / bg-subtle 等语义化类承载，
 * 组件本身不感知主题。
 */
export default function PageHeader({
  icon: Icon,
  title,
  description,
  count,
  action,
  layout = "row",
  className,
}: PageHeaderProps) {
  if (layout === "stacked") {
    return (
      <div className={cn("mb-6", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-primary">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mb-6 flex items-center justify-between", className)}>
      <div className="flex items-center gap-2 text-primary">
        {Icon && <Icon size={22} className="text-secondary" />}
        <h1 className="text-lg font-bold">{title}</h1>
        {count && (
          <span className="ml-2 rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
