import React from "react";
import { BiBox } from "react-icons/bi";
import { cn } from "@/components/utils/common";

export interface EmptyProps {
  /** 主描述文本 */
  description?: React.ReactNode;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 额外内容（CTA 按钮等） */
  children?: React.ReactNode;
  /** 卡片样式：圆角边框 + 背景 */
  bordered?: boolean;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /**
   * 图标渲染变体
   * - circle：套入圆形背景容器（默认，适合较小图标）
   * - flat：直接渲染图标节点（适合较大或自定义样式的图标）
   */
  iconVariant?: "circle" | "flat";
}

const paddingMap = {
  sm: "py-6 px-4",
  md: "py-10 px-6",
  lg: "py-16 px-6",
} as const;

export default function Empty({
  description = "暂无数据",
  icon,
  className,
  children,
  bordered = false,
  size = "md",
  iconVariant = "circle",
}: EmptyProps) {
  // icon === null 表示显式不渲染图标；icon === undefined 使用默认图标
  const showIcon = icon !== null;

  const renderIcon = () => {
    const node = icon ?? <BiBox size={20} className="text-faint" />;

    if (iconVariant === "flat") {
      return <div className="mb-3">{node}</div>;
    }

    return (
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-subtle">
        {node}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        bordered && "rounded-lg border border-edge bg-card",
        paddingMap[size],
        className
      )}
    >
      {showIcon && renderIcon()}
      {description && (
        <p className={cn(size === "sm" ? "text-sm" : "text-sm", "text-muted")}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}