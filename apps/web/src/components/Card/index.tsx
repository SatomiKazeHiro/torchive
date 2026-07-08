import React from "react";

const cx = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(" ");

// ==================== Card 卡片组件 ====================

export interface CardProps {
  /** 卡片标题 */
  title?: React.ReactNode;
  /** 标题右侧的额外操作 */
  extra?: React.ReactNode;
  /** 卡片内容 */
  children?: React.ReactNode;
  /** 底部操作区 */
  footer?: React.ReactNode;
  /** 是否有边框 */
  bordered?: boolean;
  /** 是否悬浮效果 */
  hoverable?: boolean;
  /** 是否有阴影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 内边距大小 */
  padding?: "none" | "sm" | "md" | "lg";
  /** 自定义类名 */
  className?: string;
  /** 头部类名 */
  headerClassName?: string;
  /** 内容类名 */
  bodyClassName?: string;
  /** 底部类名 */
  footerClassName?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 封面图片 */
  cover?: React.ReactNode;
  /** 左上角/右上角的操作区 */
  actions?: React.ReactNode[];
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card: React.FC<CardProps> = ({
  title,
  extra,
  children,
  footer,
  bordered = true,
  hoverable = false,
  shadow: _shadow = "sm", // flat design with light shadow
  padding = "lg", // more whitespace
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  onClick,
  cover,
  actions,
}) => {
  const clickable = !!onClick;
  const isInteractive = hoverable || clickable;

  return (
    <div
      onClick={onClick}
      className={cx(
        "group bg-card overflow-hidden rounded-lg",
        "transition-all duration-200 ease-out",
        bordered ? "border border-edge" : "",
        _shadow === "sm" ? "shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none" : "",
        isInteractive && "cursor-pointer hover:border-secondary hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.4)]",
        className
      )}
    >
      {/* 封面 */}
      {cover && (
        <div className="w-full overflow-hidden border-b border-edge-subtle">
          <div className="w-full">
            {cover}
          </div>
        </div>
      )}

      {/* 标题区 */}
      {(title || extra) && (
        <div
          className={cx(
            "flex items-center justify-between gap-4",
            "border-b border-edge-subtle",
            paddingMap[padding],
            "pb-4", // ample whitespace
            headerClassName
          )}
        >
          {title && (
            <h3 className="text-base font-medium text-primary tracking-wide">
              {title}
            </h3>
          )}
          {extra && <div className="flex-shrink-0 text-sm">{extra}</div>}
        </div>
      )}

      {/* 内容区 */}
      <div
        className={cx(
          paddingMap[padding],
          "text-secondary leading-relaxed text-[14px]",
          bodyClassName
        )}
      >
        {children}
      </div>

      {/* 操作区 */}
      {actions && actions.length > 0 && (
        <div className="flex border-t border-edge-subtle divide-x divide-edge-subtle bg-subtle">
          {actions.map((action, index) => (
            <button
              key={index}
              className={cx(
                "flex-1 py-3 text-sm font-bold text-primary",
                "transition-colors duration-200 ease-out",
                "hover:bg-edge-subtle"
              )}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* 底部 */}
      {footer && (
        <div
          className={cx(
            "border-t border-edge-subtle bg-subtle/50",
            paddingMap[padding],
            "pt-4",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

// ==================== Card.Grid 网格卡片 ====================

export interface CardGridProps {
  children?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  className = "",
  hoverable = false,
}) => {
  return (
    <div
      className={cx(
        "p-5 border-r border-b border-edge-subtle",
        "transition-colors duration-200 ease-out",
        hoverable && "hover:bg-subtle cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

// ==================== Card.Meta 元信息 ====================

export interface CardMetaProps {
  /** 标题 */
  title?: React.ReactNode;
  /** 描述 */
  description?: React.ReactNode;
  /** 头像/图标 */
  avatar?: React.ReactNode;
  className?: string;
}

export const CardMeta: React.FC<CardMetaProps> = ({
  title,
  description,
  avatar,
  className = "",
}) => {
  return (
    <div className={cx("flex items-start gap-3", className)}>
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-base font-bold text-primary truncate">
            {title}
          </div>
        )}
        {description && (
          <div className="mt-1 text-sm text-secondary line-clamp-2">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

(Card as unknown as { Grid: typeof CardGrid; Meta: typeof CardMeta }).Grid = CardGrid;
(Card as unknown as { Grid: typeof CardGrid; Meta: typeof CardMeta }).Meta = CardMeta;

export default Card;
