import { Link } from "react-router-dom";
import { cn } from "@/components/utils/common";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: ReactNode;
  /** 链接打开方式，例如 "_blank" 在新标签页打开 */
  target?: string;
}

export interface BreadcrumbProps {
  /** 面包屑项列表 */
  items: BreadcrumbItem[];
  /** 分隔符，默认 "/" */
  separator?: ReactNode;
  /** 右侧额外操作区域 */
  extra?: ReactNode;
  /** 链接默认打开方式，item 级别的 target 优先级更高 */
  linkTarget?: string;
  /** 自定义外层类名 */
  className?: string;
}

export default function Breadcrumb({
  items,
  separator = "/",
  extra,
  linkTarget,
  className,
}: BreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-edge bg-card px-3 py-2 shadow-2xs text-muted",
        className,
      )}
    >
      <nav className="flex flex-1 flex-wrap items-center gap-0.5 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const maxWidthClass = item.icon
            ? "max-w-[100px]"
            : "max-w-[120px]";

          return (
            <div key={index} className="flex items-center gap-0.5">
              {item.to ? (
                <Link
                  to={item.to}
                  target={item.target ?? linkTarget}
                  className="flex items-center gap-0.5 rounded p-1 hover:bg-subtle hover:text-primary"
                  title={item.label}
                >
                  {item.icon}
                  <span className={cn("truncate", maxWidthClass)}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-0.5 truncate rounded p-1 text-primary",
                    maxWidthClass,
                  )}
                  title={item.label}
                >
                  {item.icon}
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-faint">
                  {separator}
                </span>
              )}
            </div>
          );
        })}
      </nav>
      {extra && (
        <div className="ml-2 flex shrink-0 items-center gap-0.5 border-l border-edge pl-2">
          {extra}
        </div>
      )}
    </div>
  );
}
