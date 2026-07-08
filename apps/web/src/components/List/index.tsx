import React from "react";
import { BiChevronRight } from "react-icons/bi";

// ==================== List 列表组件 ====================

export interface ListItemProps {
  /** 列表项标题 */
  title?: React.ReactNode;
  /** 列表项描述 */
  description?: React.ReactNode;
  /** 左侧图标/头像 */
  avatar?: React.ReactNode;
  /** 右侧操作/额外内容 */
  extra?: React.ReactNode;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用悬停效果 */
  disabledHover?: boolean;
  /** 是否显示箭头 */
  arrow?: boolean;
  /** 自定义前缀 */
  prefix?: React.ReactNode;
  /** 子元素 */
  children?: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  avatar,
  extra,
  onClick,
  className = "",
  disabledHover = false,
  arrow = false,
  prefix,
  children,
}) => {
  const clickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3
        transition-all duration-200
        ${clickable && !disabledHover ? "cursor-pointer hover:bg-subtle" : ""}
        ${className}
      `}
    >
      {/* 左侧：前缀/头像 */}
      {(prefix || avatar) && (
        <div className="flex-shrink-0">{prefix || avatar}</div>
      )}

      {/* 中间：内容 */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-medium text-primary truncate">
            {title}
          </div>
        )}
        {description && (
          <div className="mt-0.5 text-xs text-muted line-clamp-2">
            {description}
          </div>
        )}
        {children}
      </div>

      {/* 右侧：额外内容/箭头 */}
      {(extra || arrow) && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {extra}
          {arrow && (
            <BiChevronRight className="text-faint" size={20} />
          )}
        </div>
      )}
    </div>
  );
};

export interface ListProps {
  /** 列表数据 */
  dataSource?: ListItemProps[];
  /** 列表头部 */
  header?: React.ReactNode;
  /** 列表底部 */
  footer?: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示分割线 */
  split?: boolean;
  /** 是否圆角 */
  rounded?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 列表项渲染函数 */
  renderItem?: (item: ListItemProps, index: number) => React.ReactNode;
  /** 子元素（ListItem） */
  children?: React.ReactNode;
  /** 空状态显示 */
  emptyText?: React.ReactNode;
  /** 加载状态 */
  loading?: boolean;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "py-2",
  md: "py-3",
  lg: "py-4",
};

// 简单的空数组检查辅助函数
const isEmptyArray = <T,>(arr?: T[]): boolean => !arr || arr.length === 0;

export const List: React.FC<ListProps> & { Item: typeof ListItem } = ({
  dataSource,
  header,
  footer,
  bordered = false,
  split = true,
  rounded = false,
  className = "",
  renderItem,
  children,
  emptyText = "暂无数据",
  loading = false,
  size = "md",
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-sm text-muted">加载中...</p>
        </div>
      );
    }

    // 使用辅助函数检查空数组
    if (isEmptyArray(dataSource)) {
      return (
        <div className="p-8 text-center text-muted">
          {emptyText}
        </div>
      );
    }

    const items = dataSource
      ? dataSource.map((item, index) =>
          renderItem ? (
            renderItem(item, index)
          ) : (
            <ListItem key={index} {...item} />
          )
        )
      : children;

    return React.Children.map(items, (child, index) => {
      if (!React.isValidElement(child)) return child;

      return (
        <React.Fragment key={index}>
          {child}
          {split && index < (dataSource?.length || React.Children.count(items)) - 1 && (
            <div className="mx-4 border-b border-edge-subtle" />
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className={`
        bg-card
        ${bordered ? "border border-edge" : ""}
        ${rounded ? "rounded-xl overflow-hidden" : ""}
        ${className}
      `}
    >
      {header && (
        <div className="px-4 py-3 border-b border-edge-subtle bg-subtle">
          {typeof header === "string" ? (
            <h3 className="text-sm font-semibold text-primary">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      <div className={sizeMap[size]}>{renderContent()}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-edge-subtle">
          {footer}
        </div>
      )}
    </div>
  );
};

List.Item = ListItem;

export default List;
