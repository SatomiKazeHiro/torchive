import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useControllableValue } from "ahooks";

const cx = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(" ");

type SwitchColor =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "blue"
  | "custom";

export interface SwitchProps {
  /** 是否选中 */
  checked?: boolean;
  /** 默认选中状态 */
  defaultChecked?: boolean;
  /** 变化回调 */
  onChange?: (checked: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 开关大小 */
  size?: "sm" | "md" | "lg";
  /** 加载状态 */
  loading?: boolean;
  /** 标签 */
  label?: React.ReactNode;
  /** 选中时的文字/图标 */
  checkedChildren?: React.ReactNode;
  /** 未选中时的文字/图标 */
  unCheckedChildren?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /**
   * 选中时的颜色主题
   * @default 'default'
   */
  color?: SwitchColor;
  /**
   * 自定义选中时的背景色类名，当 color='custom' 时使用
   * @example 'bg-orange-500', 'bg-[#ff5722]'
   */
  checkedBgClassName?: string;
}

const sizeConfig = {
  sm: {
    trackHeight: 20,
    collapsedWidth: 36,
    knobSize: 14,
    pad: 3,
    gap: 4,
    textInset: 7,
    textClass: "text-[10px] leading-none",
    labelClass: "text-sm",
  },
  md: {
    trackHeight: 28,
    collapsedWidth: 50,
    knobSize: 20,
    pad: 4,
    gap: 6,
    textInset: 10,
    textClass: "text-xs leading-none",
    labelClass: "text-sm",
  },
  lg: {
    trackHeight: 36,
    collapsedWidth: 64,
    knobSize: 28,
    pad: 4,
    gap: 8,
    textInset: 12,
    textClass: "text-sm leading-none",
    labelClass: "text-sm",
  },
} as const;

const colorConfig: Record<SwitchColor, { checked: string; unchecked: string }> = {
  default: {
    checked: "bg-accent",
    unchecked: "bg-edge hover:bg-secondary",
  },
  primary: {
    checked: "bg-accent",
    unchecked: "bg-edge hover:bg-secondary",
  },
  success: {
    checked: "bg-green-600 dark:bg-green-500",
    unchecked: "bg-edge hover:bg-secondary",
  },
  warning: {
    checked: "bg-amber-500 dark:bg-amber-500",
    unchecked: "bg-edge hover:bg-secondary",
  },
  danger: {
    checked: "bg-red-600 dark:bg-red-500",
    unchecked: "bg-edge hover:bg-secondary",
  },
  purple: {
    checked: "bg-purple-600 dark:bg-purple-500",
    unchecked: "bg-edge hover:bg-secondary",
  },
  blue: {
    checked: "bg-sky-500 dark:bg-sky-500",
    unchecked: "bg-edge hover:bg-secondary",
  },
  custom: {
    checked: "",
    unchecked: "bg-edge hover:bg-secondary",
  },
};

export const Switch: React.FC<SwitchProps> = (props) => {
  const {
    disabled = false,
    size = "md",
    loading = false,
    label,
    checkedChildren,
    unCheckedChildren,
    className = "",
    color = "default",
    checkedBgClassName = "",
  } = props;

  const [checked, setChecked] = useControllableValue<boolean>(props, {
    defaultValue: false,
    valuePropName: "checked",
    trigger: "onChange",
  });

  const hasStateContent = checkedChildren !== undefined || unCheckedChildren !== undefined;
  const current = sizeConfig[size];
  const currentColor = colorConfig[color];
  const checkedBg = color === "custom" && checkedBgClassName ? checkedBgClassName : currentColor.checked;
  const checkedMeasureRef = useRef<HTMLSpanElement>(null);
  const uncheckedMeasureRef = useRef<HTMLSpanElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [labelWidths, setLabelWidths] = useState({ checked: 0, unchecked: 0 });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!hasStateContent) {
      setLabelWidths((prev) =>
        prev.checked === 0 && prev.unchecked === 0 ? prev : { checked: 0, unchecked: 0 },
      );
      return;
    }

    const measure = () => {
      const next = {
        checked: Math.ceil(checkedMeasureRef.current?.getBoundingClientRect().width ?? 0),
        unchecked: Math.ceil(uncheckedMeasureRef.current?.getBoundingClientRect().width ?? 0),
      };

      setLabelWidths((prev) =>
        prev.checked === next.checked && prev.unchecked === next.unchecked ? prev : next,
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);

    if (checkedMeasureRef.current) {
      observer.observe(checkedMeasureRef.current);
    }
    if (uncheckedMeasureRef.current) {
      observer.observe(uncheckedMeasureRef.current);
    }

    return () => observer.disconnect();
  }, [checkedChildren, hasStateContent, size, unCheckedChildren]);

  const getTrackWidth = (contentWidth: number) =>
    Math.max(
      current.collapsedWidth,
      current.pad + current.knobSize + current.gap + contentWidth + current.textInset,
    );

  const checkedTrackWidth = getTrackWidth(labelWidths.checked);
  const uncheckedTrackWidth = getTrackWidth(labelWidths.unchecked);
  const trackWidth = hasStateContent
    ? checked
      ? checkedTrackWidth
      : uncheckedTrackWidth
    : current.collapsedWidth;

  const trackStyle: CSSProperties = {
    height: current.trackHeight,
    width: trackWidth,
  };

  const textWrapStyle: CSSProperties | undefined = hasStateContent
    ? {
        left: checked ? current.textInset : current.pad + current.knobSize + current.gap,
        right: checked ? current.pad + current.knobSize + current.gap : current.textInset,
      }
    : undefined;

  const knobStyle: CSSProperties = {
    width: current.knobSize,
    height: current.knobSize,
    top: (current.trackHeight - current.knobSize) / 2,
    left: checked ? trackWidth - current.pad - current.knobSize : current.pad,
  };

  const handleToggle = () => {
    if (disabled || loading) return;

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    setShouldAnimate(true);
    animationTimerRef.current = setTimeout(() => {
      setShouldAnimate(false);
      animationTimerRef.current = null;
    }, 350);

    setChecked(!checked);
  };

  return (
    <label
      className={cx(
        "relative inline-flex items-center gap-2.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
        onClick={handleToggle}
        className={cx(
          "group relative inline-flex shrink-0 select-none items-center overflow-hidden rounded-full ring-zinc-400/70 ring-offset-2 ring-offset-page focus:outline-none focus-visible:ring-2",
          shouldAnimate
            ? "transition-[width,background-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            : "transition-none",
          checked ? checkedBg : currentColor.unchecked,
        )}
        style={trackStyle}
      >
        {hasStateContent && (
          <span
            className={cx(
              "pointer-events-none absolute inset-y-0",
              shouldAnimate
                ? "transition-[left,right] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                : "transition-none",
            )}
            style={textWrapStyle}
          >
            <span className="relative block h-full overflow-hidden">
              <span
                className={cx(
                  "absolute inset-y-0 left-0 flex items-center whitespace-nowrap font-medium text-on-accent",
                  shouldAnimate ? "transition-all duration-250 ease-out" : "transition-none",
                  current.textClass,
                  checked ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
                )}
              >
                {checkedChildren}
              </span>
              <span
                className={cx(
                  "absolute inset-y-0 right-0 flex items-center whitespace-nowrap font-medium text-muted",
                  shouldAnimate ? "transition-all duration-250 ease-out" : "transition-none",
                  current.textClass,
                  checked ? "translate-x-1 opacity-0" : "translate-x-0 opacity-100",
                )}
              >
                {unCheckedChildren}
              </span>
            </span>
          </span>
        )}

        <span
          className={cx(
            "absolute flex transform-gpu items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
            shouldAnimate
              ? "transition-[left,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              : "transition-none",
            !disabled && !loading && "group-active:scale-95",
          )}
          style={knobStyle}
        >
          {loading && (
            <svg className="h-2/3 w-2/3 animate-spin text-muted" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </span>
      </button>

      {label && (
        <span
          className={cx(
            "select-none font-medium text-primary",
            current.labelClass,
          )}
        >
          {label}
        </span>
      )}

      {hasStateContent && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-0 flex whitespace-nowrap opacity-0"
        >
          <span ref={checkedMeasureRef} className={cx("font-medium", current.textClass)}>
            {checkedChildren}
          </span>
          <span ref={uncheckedMeasureRef} className={cx("font-medium", current.textClass)}>
            {unCheckedChildren}
          </span>
        </span>
      )}
    </label>
  );
};

export default Switch;
