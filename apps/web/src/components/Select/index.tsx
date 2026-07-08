import React, { useState, useRef, useEffect, type ReactNode } from "react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  /** 选项列表 */
  options: SelectOption<T>[];
  /** 当前值 */
  value?: T;
  /** 值变化回调 */
  onChange?: (value: T) => void;
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 清除回调 */
  onClear?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 标签 */
  label?: ReactNode;
  /** 标签类名 */
  labelClassName?: string;
  /** 尺寸大小 */
  size?: "sm" | "md" | "lg";
}

// 标准尺寸：sm=32px, md=40px, lg=48px
const sizeMap = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "请选择",
  disabled = false,
  allowClear = false,
  onClear,
  className = "",
  label,
  labelClassName = "",
  size = "md",
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            handleSelect(option.value);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (selectedValue: T) => {
    if (selectedValue !== value) {
      onChange?.(selectedValue);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    // 使用类型断言，空字符串会被转换为 T 类型（T 包含 "" 联合类型时）
    onChange?.("" as T);
  };

  const hasValue = value !== undefined && value !== "" && value !== null;
  const showClearButton = allowClear && hasValue && !disabled;

  return (
    <div className="w-full">
      {label && (
        <label
          className={`block text-[13px] font-medium text-primary mb-1.5 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        className={`relative ${className}`}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        {/* 选择器触发区域 */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between w-full
            border rounded-md cursor-pointer outline-none
            transition-all duration-200 ease-out
            ${sizeMap[size]}
            ${
              disabled
                ? "bg-subtle text-faint cursor-not-allowed border-edge"
                : "bg-card border-edge hover:border-secondary"
            }
            ${isOpen ? "ring-1 ring-accent border-accent" : ""}
          `}
        >
          {/* 选中的值或占位符 */}
          <span
            className={`truncate flex-1 ${
              hasValue ? "text-primary" : "text-faint"
            }`}
          >
            {selectedOption?.label || placeholder}
          </span>

          {/* 右侧按钮区域 */}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {/* 清除按钮 */}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="
                  p-0.5 rounded-full text-faint hover:text-secondary
                  hover:bg-subtle transition-colors
                  focus:outline-none focus:ring-1 focus:ring-edge
                "
                aria-label="清除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* 下拉箭头 */}
            <svg
              className={`w-4 h-4 text-faint transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* 下拉选项列表 */}
        {isOpen && (
          <div
            className="
              absolute z-50 w-full mt-1.5 py-1.5
              bg-card border border-edge rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.4)]
              max-h-60 overflow-auto
            "
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted text-center">
                暂无选项
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`
                    px-3 py-2 text-[13px] cursor-pointer
                    transition-colors duration-150 mx-1.5 rounded-sm
                    ${
                      option.value === value
                        ? "bg-subtle text-primary font-medium"
                        : "text-secondary hover:bg-subtle/70"
                    }
                    ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${index === highlightedIndex && option.value !== value ? "bg-subtle/70" : ""}
                  `}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Select;
