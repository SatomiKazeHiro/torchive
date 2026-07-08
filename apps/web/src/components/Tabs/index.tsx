import React, { useState, useEffect, useRef } from "react";
import { useControllableValue } from "ahooks";
import { cn } from "../utils/common"; 

// ==================== Tabs 标签页 ====================

export interface TabItem {
  /** 标签页的唯一标识 */
  key: string;
  /** 标签页标题 */
  label: React.ReactNode;
  /** 标签页内容 */
  children?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标 */
  icon?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

export interface TabsProps {
  /** 当前激活的标签页 */
  activeKey?: string;
  /** 默认激活的标签页 */
  defaultActiveKey?: string;
  /** 标签页数组 */
  items?: TabItem[];
  /** 切换回调 */
  onChange?: (activeKey: string) => void;
  /** 标签页位置 */
  position?: "top" | "left" | "right" | "bottom";
  /** 标签类型 */
  type?: "line" | "card" | "pills";
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: (key: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 标签栏类名 */
  tabBarClassName?: string;
  /** 内容区类名 */
  contentClassName?: string;
  /** 标签大小 */
  size?: "sm" | "md" | "lg";
  /** 是否居中 */
  centered?: boolean;
  /** 额外内容（右侧插槽） */
  tabBarExtraContent?: React.ReactNode;
  /** 左侧插槽 */
  tabBarLeftContent?: React.ReactNode;
  /** 子元素（用于复杂场景） */
  children?: React.ReactNode;
}

const sizeMap = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-2 px-4 text-sm",
  lg: "py-2.5 px-5 text-base",
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  // onChange 由 useControllableValue 内部处理，无需显式解构
  position = "top",
  type = "line",
  closable = false,
  onClose,
  className = "",
  tabBarClassName = "",
  contentClassName = "",
  size = "md",
  centered = false,
  tabBarExtraContent,
  tabBarLeftContent,
  children,
  ...rest
}) => {
  // 使用 ahooks useControllableValue 管理激活状态
  const [currentKey, setCurrentKey] = useControllableValue<string>({
    ...rest,
    defaultValue: rest.defaultActiveKey || items?.[0]?.key,
    valuePropName: "activeKey",
    trigger: "onChange",
  });

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, top: 0, height: 0 });
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setCurrentKey(key);
  };

  // 检查是否需要显示滚动按钮
  useEffect(() => {
    const checkOverflow = () => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && position === "top") {
        setShowScrollButtons(scrollContainer.scrollWidth > scrollContainer.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [items, position]);

  // 更新指示器位置
  useEffect(() => {
    const activeTab = tabRefs.current.get(currentKey || "");
    if (!activeTab) return;

    const isHorizontal = position === "top" || position === "bottom";

    if (isHorizontal) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        top: position === "top" ? activeTab.offsetHeight - 2 : 0,
        height: 2,
      });
    } else {
      setIndicatorStyle({
        left: position === "left" ? activeTab.offsetWidth - 2 : 0,
        width: 2,
        top: activeTab.offsetTop,
        height: activeTab.offsetHeight,
      });
    }

    // 滚动到可见区域
    if (scrollContainerRef.current && position === "top") {
      const scrollContainer = scrollContainerRef.current;
      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;
      const containerScrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;

      if (tabLeft < containerScrollLeft) {
        scrollContainer.scrollTo({ left: tabLeft, behavior: "smooth" });
      } else if (tabRight > containerScrollLeft + containerWidth) {
        scrollContainer.scrollTo({ left: tabRight - containerWidth, behavior: "smooth" });
      }
    }
  }, [currentKey, position, items]);

  const isHorizontal = position === "top" || position === "bottom";

  // 滚动处理
  const handleScroll = (direction: "left" | "right") => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const scrollAmount = scrollContainer.clientWidth * 0.5;
    scrollContainer.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // 渲染标签栏
  const renderTabBar = () => {
    const baseTabClass = `
      relative flex items-center gap-2 font-medium transition-colors duration-200 focus:outline-none select-none whitespace-nowrap
      ${sizeMap[size]}
    `;

    const typeClasses = {
      line: "text-muted hover:text-primary",
      card: "border-b-2 border-transparent hover:text-primary",
      pills: "rounded-md",
    };

    const TabList = (
      <div
        ref={scrollContainerRef}
        className={`
          flex ${isHorizontal ? "flex-row" : "flex-col"}
          ${isHorizontal ? "overflow-x-auto scrollbar-hide" : "overflow-y-auto"}
          ${isHorizontal ? "flex-1" : ""}
        `}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items?.map((item) => {
          const isActive = currentKey === item.key;

          return (
            <button
              key={item.key}
              ref={(el) => {
                if (el) tabRefs.current.set(item.key, el);
              }}
              onClick={() => handleTabChange(item.key, item.disabled)}
              disabled={item.disabled}
              className={`
                ${baseTabClass}
                ${typeClasses[type]}
                ${isActive ? "text-primary" : ""}
                ${
                  type === "card" && isActive
                    ? "text-primary border-accent"
                    : ""
                }
                ${type === "pills" && isActive ? "bg-card shadow-2xs-soft text-primary" : ""}
                ${item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${type === "pills" && !isActive ? "text-muted hover:bg-subtle" : ""}
              `}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {closable && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.(item.key);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-subtle transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}

        {/* 下划线指示器 (line 类型) */}
        {type === "line" && (
          <div
            className="absolute bg-accent transition-all duration-300 ease-out rounded-full pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              top: position === "top" ? undefined : indicatorStyle.top,
              bottom: position === "top" ? 0 : undefined,
              height: indicatorStyle.height,
              [position === "left" ? "right" : "left"]: position === "left" ? 0 : indicatorStyle.left,
            }}
          />
        )}
      </div>
    );

    return (
      <div
        ref={containerRef}
        className={`
          relative flex ${isHorizontal ? "flex-row items-center" : "flex-col"}
          ${isHorizontal ? "border-b border-edge" : "border-r border-edge min-w-[120px]"}
          ${tabBarClassName}
        `}
      >
        {/* 左侧内容 */}
        {tabBarLeftContent && (
          <div className="flex-shrink-0">{tabBarLeftContent}</div>
        )}

        {/* 左滚动按钮 */}
        {showScrollButtons && isHorizontal && (
          <button
            onClick={() => handleScroll("left")}
            className="flex-shrink-0 p-1.5 text-faint hover:text-secondary transition-colors"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Tab 列表 */}
        <div className={`
          relative flex-1 overflow-hidden
          ${centered && isHorizontal && !tabBarLeftContent && !tabBarExtraContent ? "flex justify-center" : ""}
        `}>
          {TabList}
        </div>

        {/* 右滚动按钮 */}
        {showScrollButtons && isHorizontal && (
          <button
            onClick={() => handleScroll("right")}
            className="flex-shrink-0 p-1.5 text-faint hover:text-secondary transition-colors"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 右侧插槽 */}
        {tabBarExtraContent && (
          <div className="flex-shrink-0 ml-auto">{tabBarExtraContent}</div>
        )}
      </div>
    );
  };

  // 渲染内容
  const renderContent = () => {
    const activeItem = items?.find((item) => item.key === currentKey);

    return (
      <div className={cn('flex-1 p-4', contentClassName)}>
        {activeItem?.children || children}
      </div>
    );
  };

  return (
    <div
      className={`
        flex ${position === "bottom" ? "flex-col-reverse" : position === "right" ? "flex-row-reverse" : "flex-col"}
        ${position === "left" || position === "right" ? "flex-row" : ""}
        ${className}
      `}
    >
      {renderTabBar()}
      {renderContent()}
    </div>
  );
};

// ==================== TabPane (用于复杂场景的子组件) ====================

export interface TabPaneProps {
  tab: React.ReactNode;
  children?: React.ReactNode;
  key: string;
  disabled?: boolean;
}

export const TabPane: React.FC<TabPaneProps> = ({ children }) => {
  return <>{children}</>;
};

(Tabs as unknown as { TabPane: typeof TabPane }).TabPane = TabPane;

export default Tabs;
