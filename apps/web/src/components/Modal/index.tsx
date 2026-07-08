import React, { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useControllableValue, useKeyPress } from "ahooks";
import { BiCheckCircle, BiError, BiErrorCircle, BiInfoCircle, BiX } from "react-icons/bi";

// ==================== 类型定义 ====================

/** 弹窗类型 */
export type ModalType = "info" | "success" | "warning" | "error" | "confirm";

/** 弹窗宽度 */
export type ModalWidth = "sm" | "md" | "lg" | "xl" | number;

/** 弹窗属性接口 */
export interface ModalProps {
  /** 是否可见 */
  open?: boolean;
  /** 标题 */
  title?: ReactNode;
  /** 内容 */
  children?: ReactNode;
  /** 自定义底部 */
  footer?: ReactNode | null;
  /** 确认按钮文字 */
  okText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否显示确认按钮 */
  showOk?: boolean;
  /** 弹窗类型（影响图标和按钮样式） */
  type?: ModalType;
  /** 弹窗宽度 */
  width?: ModalWidth;
  /** 点击确认回调 */
  onOk?: () => void | Promise<void>;
  /** 点击取消回调 */
  onCancel?: () => void;
  /** 关闭后回调 */
  afterClose?: () => void;
  /** 是否显示关闭图标 */
  closable?: boolean;
  /** 是否允许点击蒙层关闭 */
  maskClosable?: boolean;
  /** 是否显示蒙层 */
  mask?: boolean;
  /** 确认按钮加载状态 */
  confirmLoading?: boolean;
  /** 确认按钮是否禁用 */
  okButtonDisabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义内容类名 */
  contentClassName?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 垂直居中 */
  centered?: boolean;
  /** 层级 */
  zIndex?: number;
  /** 是否销毁关闭时 */
  destroyOnClose?: boolean;
}

// ==================== 配置常量 ====================

// 宽度映射
const widthMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

// 类型配置
const typeConfig = {
  info: {
    icon: BiInfoCircle,
    color: "text-primary",
    bg: "bg-subtle",
    btnClass: "bg-accent text-on-accent hover:opacity-90 shadow-2xs",
  },
  success: {
    icon: BiCheckCircle,
    color: "text-success-green",
    bg: "bg-success-green/10 dark:bg-success-green/20",
    btnClass: "bg-accent text-on-accent hover:opacity-90 shadow-2xs",
  },
  warning: {
    icon: BiError, // 三角形警告
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    btnClass: "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 shadow-2xs",
  },
  error: {
    icon: BiErrorCircle,
    color: "text-callout-red",
    bg: "bg-callout-red/10 dark:bg-callout-red/20",
    btnClass: "bg-callout-red text-white hover:bg-callout-red/90 shadow-2xs",
  },
  confirm: {
    icon: BiErrorCircle,
    color: "text-muted",
    bg: "bg-subtle",
    btnClass: "bg-accent text-on-accent hover:opacity-90 shadow-2xs",
  },
} as const;

// ==================== 组件实现 ====================

const Modal: React.FC<ModalProps> = ({
  title,
  children,
  footer,
  okText = "确认",
  cancelText = "取消",
  showCancel = true,
  showOk = true,
  type = "info",
  width = "md",
  onOk,
  afterClose,
  closable = true,
  maskClosable = true,
  mask = true,
  confirmLoading = false,
  okButtonDisabled = false,
  className = "",
  contentClassName = "",
  style,
  centered = true,
  zIndex = 50,
  destroyOnClose = false,
  ...rest
}) => {
  // 使用 ahooks useControllableValue 管理显隐状态
  const [open, setOpen] = useControllableValue<boolean>(rest, {
    defaultValue: false,
    valuePropName: "open",
    trigger: "onCancel",
  });

  const [visible, setVisible] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [animationClass, setAnimationClass] = useState("opacity-0 scale-95");
  const [hasDestroyed, setHasDestroyed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 监听 open 变化
  React.useEffect(() => {
    if (open) {
      setVisible(true);
      setHasDestroyed(false);
      // 下一帧执行动画
      const timer = requestAnimationFrame(() => {
        setAnimationClass("opacity-100 scale-100");
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setAnimationClass("opacity-0 scale-95");
      const timer = setTimeout(() => {
        setVisible(false);
        afterClose?.();
        if (destroyOnClose) {
          setHasDestroyed(true);
        }
      }, 200); // 动画时长
      return () => clearTimeout(timer);
    }
  }, [open, afterClose, destroyOnClose]);

  // 使用 ahooks useKeyPress 替代手动键盘事件监听
  useKeyPress(
    "esc",
    () => {
      if (open && maskClosable && !internalLoading && !confirmLoading) {
        handleCancel();
      }
    },
    {
      target: visible ? document : undefined,
    },
  );

  // 锁定 Body 滚动
  React.useEffect(() => {
    if (visible) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [visible]);

  const handleOk = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onOk?.();
    } finally {
      setInternalLoading(false);
    }
  }, [onOk]);

  const handleCancel = useCallback(() => {
    if (internalLoading || confirmLoading) return;
    setOpen(false);
  }, [internalLoading, confirmLoading, setOpen]);

  const handleMaskClick = useCallback(() => {
    if (maskClosable && !internalLoading && !confirmLoading) {
      handleCancel();
    }
  }, [maskClosable, internalLoading, confirmLoading, handleCancel]);

  if (!visible || hasDestroyed) return null;

  // 样式计算
  const widthClass = typeof width === "number" ? "" : widthMap[width] || widthMap.md;
  const widthStyle: CSSProperties = typeof width === "number" ? { maxWidth: `${width}px` } : {};

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  const isLoading = internalLoading || confirmLoading;

  const renderFooter = () => {
    if (footer === null) return null;
    if (footer) return <div className="mt-6">{footer}</div>;

    return (
      <div className="mt-6 flex justify-end gap-3">
        {showCancel && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-md border border-edge bg-card px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-subtle hover:border-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
        )}
        {showOk && (
          <button
            onClick={handleOk}
            disabled={isLoading || okButtonDisabled}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${config.btnClass}`}
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {okText}
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 flex justify-center transition-opacity duration-200 ${
        centered ? "items-center" : "items-start pt-[10vh]"
      } ${open ? "opacity-100" : "opacity-0"}`}
      style={{ zIndex }}
    >
      {/* 蒙层 */}
      {mask && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all dark:bg-black/60"
          onClick={handleMaskClick}
        />
      )}

      {/* 弹窗主体 */}
      <div
        ref={contentRef}
        className={`relative mx-4 w-full transform rounded-lg border border-edge bg-card p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-200 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${widthClass} ${animationClass} ${className}`}
        style={{ ...style, ...widthStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题区 - 图标、标题、关闭按钮同一水平线 */}
        {title && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* 简约图标：无背景圆形，仅颜色区分 */}
              {type !== "confirm" && <Icon className={`shrink-0 ${config.color}`} size={22} />}
              <h3 className="text-[16px] font-medium tracking-wide text-primary">{title}</h3>
            </div>
            {/* 关闭按钮 */}
            {closable && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="shrink-0 rounded-full p-1.5 text-muted transition-all hover:bg-subtle hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="关闭"
              >
                <BiX size={20} />
              </button>
            )}
          </div>
        )}

        {/* 无标题时的关闭按钮 */}
        {!title && closable && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 rounded-full p-1.5 text-muted transition-all hover:bg-subtle hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="关闭"
          >
            <BiX size={20} />
          </button>
        )}

        {/* 内容区 */}
        <div
          className={`text-[14px] leading-relaxed text-secondary ${contentClassName}`}
        >
          {children}
        </div>

        {/* 底部按钮区 */}
        {renderFooter()}
      </div>
    </div>
  );
};

export default Modal;
