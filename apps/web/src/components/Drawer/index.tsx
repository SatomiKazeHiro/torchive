import React, { useEffect, useState, useCallback } from "react";
import { BiX } from "react-icons/bi";

// ==================== Drawer 抽屉 ====================

export interface DrawerProps {
  /** 是否可见 */
  open?: boolean;
  /** 标题 */
  title?: React.ReactNode;
  /** 内容 */
  children?: React.ReactNode;
  /** 抽屉位置 */
  placement?: "left" | "right" | "top" | "bottom";
  /** 抽屉宽度（左右位置） */
  width?: number | string;
  /** 抽屉高度（上下位置） */
  height?: number | string;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 遮罩样式 */
  maskStyle?: React.CSSProperties;
  /** 抽屉样式 */
  drawerStyle?: React.CSSProperties;
  /** 内容样式 */
  contentStyle?: React.CSSProperties;
  /** 头部样式 */
  headerStyle?: React.CSSProperties;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 底部样式 */
  footerStyle?: React.CSSProperties;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义头部 */
  extra?: React.ReactNode;
  /** 层级 */
  zIndex?: number;
  /** 是否销毁关闭时 */
  destroyOnClose?: boolean;
  /** 关闭后回调 */
  afterClose?: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  open = false,
  title,
  children,
  placement = "right",
  width = 400,
  height = 400,
  onClose,
  mask = true,
  maskClosable = true,
  maskStyle,
  drawerStyle,
  contentStyle,
  headerStyle,
  footer,
  footerStyle,
  closable = true,
  className = "",
  extra,
  zIndex = 50,
  destroyOnClose = false,
  afterClose,
}) => {
  const [visible, setVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState("");
  const [hasDestroyed, setHasDestroyed] = useState(false);

  // 处理显示/隐藏动画
  useEffect(() => {
    if (open) {
      setHasDestroyed(false);
      setVisible(true);
      // 下一帧执行动画
      const timer = requestAnimationFrame(() => {
        setAnimationClass(getAnimationClass(true));
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setAnimationClass(getAnimationClass(false));
      const timer = setTimeout(() => {
        setVisible(false);
        afterClose?.();
        if (destroyOnClose) {
          setHasDestroyed(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placement, destroyOnClose, afterClose]);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && maskClosable) {
        onClose?.();
      }
    };

    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
      // 锁定 body 滚动
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [visible, open, maskClosable, onClose]);

  const getAnimationClass = (isOpen: boolean) => {
    const translateClasses = {
      left: isOpen ? "translate-x-0" : "-translate-x-full",
      right: isOpen ? "translate-x-0" : "translate-x-full",
      top: isOpen ? "translate-y-0" : "-translate-y-full",
      bottom: isOpen ? "translate-y-0" : "translate-y-full",
    };
    return translateClasses[placement];
  };

  const handleMaskClick = useCallback(() => {
    if (maskClosable) {
      onClose?.();
    }
  }, [maskClosable, onClose]);

  if (!visible || hasDestroyed) return null;

  // 计算尺寸样式
  const sizeStyle: React.CSSProperties =
    placement === "left" || placement === "right"
      ? { width: typeof width === "number" ? `${width}px` : width }
      : { height: typeof height === "number" ? `${height}px` : height };

  const placementClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  };

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* 遮罩 */}
      {mask && (
        <div
          className={`
            absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm
            transition-opacity duration-300
            ${open ? "opacity-100" : "opacity-0"}
          `}
          style={maskStyle}
          onClick={handleMaskClick}
        />
      )}

      {/* 抽屉主体 */}
      <div
        className={`
          absolute bg-card shadow-xl border border-edge
          transition-transform duration-300 ease-out
          ${placementClasses[placement]}
          ${animationClass}
          ${className}
        `}
        style={{ ...sizeStyle, ...drawerStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {(title || closable || extra) && (
          <div
            className="
              flex items-center justify-between gap-4
              px-6 py-4
            "
            style={headerStyle}
          >
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-primary truncate">
                  {title}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {extra}
              {closable && (
                <button
                  onClick={onClose}
                  className="
                    p-2 rounded-full
                    text-faint hover:text-secondary hover:bg-subtle
                    transition-colors duration-200
                  "
                  aria-label="关闭"
                >
                  <BiX size={24} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 内容区 */}
        <div
          className="overflow-auto"
          style={{
            ...contentStyle,
            maxHeight: `calc(100% - ${title || closable || extra ? "73px" : "0px"}${footer ? " - 73px" : ""})`,
          }}
        >
          <div className="px-6 pb-6">{children}</div>
        </div>

        {/* 底部 */}
        {footer && (
          <div
            className="
              absolute bottom-0 left-0 right-0
              px-6 py-4 border-t border-edge-subtle
              bg-card
            "
            style={footerStyle}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
