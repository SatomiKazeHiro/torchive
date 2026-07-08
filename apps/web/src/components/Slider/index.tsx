import React, { useRef, useCallback } from "react";
import { useControllableValue, useBoolean, useEventListener } from "ahooks";
import { clamp as esClamp } from "es-toolkit";

export interface SliderProps {
  /** 当前值 */
  value?: number;
  /** 默认值 */
  defaultValue?: number;
  /** 最小值 */
  min?: number;
  max?: number;
  /** 步长 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变化回调 */
  onChange?: (value: number) => void;
  /** 变化结束后回调 */
  onChangeComplete?: (value: number) => void;
  /** 标签 */
  label?: React.ReactNode;
  /** 是否显示输入框 */
  showInput?: boolean;
  /** 是否显示刻度 */
  showTicks?: boolean;
  /** 刻度标记 */
  marks?: Record<number, React.ReactNode>;
  /** 提示格式化 */
  tipFormatter?: (value: number) => React.ReactNode;
  /** 是否显示提示 */
  tooltipVisible?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 轨道（背景）自定义类名 */
  trackClassName?: string;
  /** 进度条（已选择区域）自定义类名 */
  progressClassName?: string;
  /** 滑块自定义类名 */
  thumbClassName?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onChange,
  onChangeComplete,
  label,
  showInput = false,
  showTicks = false,
  marks,
  tipFormatter,
  tooltipVisible,
  className = "",
  trackClassName = "",
  progressClassName = "",
  thumbClassName = "",
}) => {
  // 使用 ahooks useControllableValue 管理值
  const [currentValue, setCurrentValue] = useControllableValue<number>({
    value,
    defaultValue: defaultValue ?? min,
    onChange,
  });

  // 使用 ahooks useBoolean 管理拖拽和提示状态
  const [isDragging, { setTrue: startDragging, setFalse: stopDragging }] = useBoolean(false);
  const [isTooltipVisible, { setTrue: showTooltip, setFalse: hideTooltip }] = useBoolean(false);

  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  // 使用 es-toolkit clamp 替代手动实现
  const clampValue = useCallback(
    (val: number) => {
      let clamped = esClamp(val, min, max);
      if (step > 0) {
        const steps = Math.round((clamped - min) / step);
        clamped = min + steps * step;
      }
      // 处理浮点数精度
      return Number(clamped.toFixed(10));
    },
    [min, max, step]
  );

  const handleChange = useCallback(
    (newValue: number) => {
      const clamped = clampValue(newValue);
      setCurrentValue(clamped);
    },
    [clampValue, setCurrentValue]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      return min + position * (max - min);
    },
    [min, max]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      startDragging();
      const newValue = getValueFromPosition(e.clientX);
      handleChange(newValue);
    },
    [disabled, startDragging, getValueFromPosition, handleChange]
  );

  // 使用 ahooks useEventListener 替代手动事件监听
  useEventListener(
    "mousemove",
    (e) => {
      if (!isDragging) return;
      const newValue = getValueFromPosition(e.clientX);
      handleChange(newValue);
    },
    { target: document }
  );

  useEventListener(
    "mouseup",
    () => {
      if (isDragging) {
        stopDragging();
        onChangeComplete?.(currentValue);
      }
    },
    { target: document }
  );

  // 生成刻度
  const ticks = showTicks
    ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
    : [];

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = currentValue;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = currentValue + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = currentValue - step;
        break;
      case "Home":
        e.preventDefault();
        newValue = min;
        break;
      case "End":
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }
    handleChange(newValue);
    onChangeComplete?.(newValue);
  };

  const displayTooltip = tooltipVisible !== undefined ? tooltipVisible : isTooltipVisible || isDragging;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-4">
        {label && (
          <span className="text-sm font-medium text-primary flex-shrink-0">
            {label}
          </span>
        )}

        <div className="flex-1">
          {/* 滑轨 */}
          <div
            ref={trackRef}
            className={`
              relative h-1.5 rounded-full
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              ${trackClassName || "bg-edge"}
            `}
            onMouseDown={handleMouseDown}
          >
            {/* 已选择区域 */}
            <div
              className={`
                absolute h-full rounded-full
                ${progressClassName || "bg-accent"}
              `}
              style={{ width: `${percentage}%` }}
            />

            {/* 滑块 */}
            <div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={currentValue}
              className={`
                absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                w-4 h-4 rounded-full shadow-md transition-transform duration-100
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-page
                ${disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing hover:scale-110"}
                ${thumbClassName || "bg-card border-2 border-accent"}
              `}
              style={{ left: `${percentage}%` }}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
              onKeyDown={handleKeyDown}
            >
              {/* Tooltip */}
              {displayTooltip && tipFormatter !== null && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-on-accent bg-accent rounded shadow-lg whitespace-nowrap">
                  {tipFormatter ? tipFormatter(currentValue) : currentValue}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-accent" />
                </div>
              )}
            </div>

            {/* 刻度 */}
            {showTicks &&
              ticks.map((tick) => {
                const tickPercent = ((tick - min) / (max - min)) * 100;
                return (
                  <div
                    key={tick}
                    className="absolute top-full mt-1 -translate-x-1/2"
                    style={{ left: `${tickPercent}%` }}
                  >
                    <div className="w-0.5 h-1.5 bg-edge mx-auto" />
                    {marks?.[tick] && (
                      <span className="text-xs text-muted mt-0.5 block text-center">
                        {marks[tick]}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 输入框 */}
        {showInput && (
          <input
            type="number"
            value={currentValue}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => handleChange(Number(e.target.value))}
            onBlur={() => onChangeComplete?.(currentValue)}
            className="
              w-16 px-2 py-1 text-sm text-center
              border border-edge rounded-md
              bg-card
              text-primary
              focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        )}
      </div>
    </div>
  );
};

export default Slider;
