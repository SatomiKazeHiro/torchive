import React, { useMemo } from "react";
import { BiChevronLeft, BiChevronRight, BiDotsHorizontalRounded } from "react-icons/bi";

export interface PaginationProps {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total?: number;
  /** 页码改变回调 */
  onChange?: (page: number) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否显示总数 */
  showTotal?: boolean | ((total: number, range: [number, number]) => React.ReactNode);
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 尺寸 */
  size?: "sm" | "md";
  /** 简洁模式 */
  simple?: boolean;
}

export default function Pagination({
  current = 1,
  pageSize = 10,
  total = 0,
  onChange,
  className = "",
  showTotal = true,
  showQuickJumper = false,
  size = "md",
  simple = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 计算分页页码（hooks 必须在早期 return 之前调用）
  const getPageNumbers = useMemo((): (number | string)[] => {
    const pages: (number | string)[] = [];
    // 简单的显示逻辑：始终显示第一页和最后一页，当前页前后各显示几页
    const delta = 1; // 当前页前后显示的页数

    if (totalPages <= 7) {
      // 页数较少时全部显示
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // 页数较多时，显示省略号
      let left = Math.max(2, current - delta);
      let right = Math.min(totalPages - 1, current + delta);

      if (current - 1 <= 2) right = 5; // 靠近开头
      if (totalPages - current <= 2) left = totalPages - 4; // 靠近结尾

      pages.push(1);
      if (left > 2) pages.push("...");

      for (let i = left; i <= right; i++) pages.push(i);

      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [current, totalPages]);

  // 如果只有一页且不强制显示，通常可以隐藏，但为了布局稳定性，这里保留或由父级控制
  // 这里我们假设总是渲染，除非 total 为 0
  if (total === 0) return null;

  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === current) return;
    onChange?.(page);
  };

  // 尺寸样式
  const sizeClass = size === "sm" ? "h-7 px-2 text-xs min-w-[1.75rem]" : "h-9 px-3 text-sm min-w-[2.25rem]";
  // 上一页/下一页按钮尺寸（固定宽高）
  const navBtnSizeClass = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 16;
  const gapClass = size === "sm" ? "gap-1" : "gap-2";

  // 基础按钮样式
  const baseBtnClass = `
    flex items-center justify-center rounded-md font-medium transition-colors duration-200
    select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
  `;

  // 渲染总数
  const renderTotal = () => {
    if (!showTotal) return null;
    const range: [number, number] = [
      (current - 1) * pageSize + 1,
      Math.min(current * pageSize, total),
    ];

    if (typeof showTotal === "function") {
      return <div className="text-muted text-[13px]">{showTotal(total, range)}</div>;
    }

    return (
      <div className="text-muted text-[13px]">
        共 {total} 条
      </div>
    );
  };

  // 简洁模式
  if (simple) {
    return (
      <div className={`flex items-center ${gapClass} ${className}`}>
        <button
          onClick={() => handleChange(current - 1)}
          disabled={current === 1}
          className={`${baseBtnClass} ${navBtnSizeClass} ${current === 1 ? "text-faint cursor-not-allowed" : "text-secondary hover:bg-subtle"}`}
          aria-label="上一页"
        >
          <BiChevronLeft size={iconSize} />
        </button>
        <span className="text-[13px] text-secondary select-none">
          {current} / {totalPages}
        </span>
        <button
          onClick={() => handleChange(current + 1)}
          disabled={current === totalPages}
          className={`${baseBtnClass} ${navBtnSizeClass} ${current === totalPages ? "text-faint cursor-not-allowed" : "text-secondary hover:bg-subtle"}`}
          aria-label="下一页"
        >
          <BiChevronRight size={iconSize} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      {renderTotal()}

      <div className={`flex items-center ${gapClass}`}>
        {/* 上一页 */}
        <button
          onClick={() => handleChange(current - 1)}
          disabled={current === 1}
          className={`${baseBtnClass} border border-edge ${navBtnSizeClass} ${current === 1 ? "text-faint bg-subtle cursor-not-allowed" : "text-secondary bg-card hover:border-secondary hover:bg-subtle"}`}
          aria-label="上一页"
        >
          <BiChevronLeft size={iconSize} />
        </button>

        {/* 页码 */}
        <div className={`flex items-center ${size === "sm" ? "gap-1" : "gap-1.5"}`}>
          {getPageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={`flex items-center justify-center text-faint ${navBtnSizeClass}`}
                >
                  <BiDotsHorizontalRounded size={iconSize} />
                </span>
              );
            }

            const isCurrent = page === current;
            return (
              <button
                key={page}
                onClick={() => handleChange(page as number)}
                className={`${baseBtnClass} border ${sizeClass} ${
                  isCurrent
                    ? "border-accent bg-accent text-on-accent shadow-2xs"
                    : "border-edge bg-card text-secondary hover:border-secondary hover:bg-subtle"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* 下一页 */}
        <button
          onClick={() => handleChange(current + 1)}
          disabled={current === totalPages}
          className={`${baseBtnClass} border border-edge ${navBtnSizeClass} ${current === totalPages ? "text-faint bg-subtle cursor-not-allowed" : "text-secondary bg-card hover:border-secondary hover:bg-subtle"}`}
          aria-label="下一页"
        >
          <BiChevronRight size={iconSize} />
        </button>

        {/* 快速跳转 */}
        {showQuickJumper && (
          <div className="flex items-center gap-2 ml-2 text-sm text-muted">
            <span>前往</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) {
                    handleChange(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
              className={`
                w-12 px-1 text-center bg-card
                border border-edge rounded-md
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                transition-all duration-200
                ${size === "sm" ? "h-7 text-xs" : "h-9 text-sm"}
              `}
            />
            <span>页</span>
          </div>
        )}
      </div>
    </div>
  );
}

