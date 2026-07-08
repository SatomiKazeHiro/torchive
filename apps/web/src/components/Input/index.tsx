import React, { forwardRef, useMemo } from "react";
import { useControllableValue, useBoolean } from "ahooks";
import { BiX, BiShow, BiHide } from "react-icons/bi";

type InputSize = "sm" | "md" | "lg";
type InputVariant = "input" | "textarea";

// 标准尺寸：sm=32px, md=40px, lg=48px（input专用）
// textarea 使用 min-height 替代固定高度
const sizeMap = {
  sm: "min-h-[32px] px-3 text-sm",
  md: "min-h-[40px] px-4 text-sm",
  lg: "min-h-[48px] px-4 text-base",
};

interface BaseInputProps {
  /** 输入框大小 */
  size?: InputSize;
  /** 变体类型：input 或 textarea */
  variant?: InputVariant;
  /** 错误状态 */
  error?: boolean;
  /** 错误提示 */
  errorMessage?: string;
  /** 标签 */
  label?: React.ReactNode;
  /** 标签类名 */
  labelClassName?: string;
  /** 前缀图标/内容 */
  prefixIcon?: React.ReactNode;
  /** 后缀图标/内容 */
  suffixIcon?: React.ReactNode;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 清除回调 */
  onClear?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 输入框类名 */
  inputClassName?: string;
  /** 输入框行数（仅 textarea） */
  rows?: number;
}

export type InputProps = BaseInputProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "type" | "onChange"> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "prefix" | "onChange"> & {
    /** 输入框类型（仅 input 模式有效） */
    type?: React.HTMLInputTypeAttribute;
    onChange?: (value: string) => void;
  };

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      size = "md",
      variant = "input",
      error,
      errorMessage,
      label,
      labelClassName = "",
      prefixIcon,
      suffixIcon,
      allowClear,
      onClear,
      className = "",
      inputClassName = "",
      disabled,
      type = "text",
      value: valueProp,
      defaultValue = "",
      onChange: onChangeProp,
      rows = 3,
      ...rest
    },
    ref,
  ) => {
    // 使用 ahooks useControllableValue 管理值
    const [value, setValue] = useControllableValue<string>(
      { value: valueProp, defaultValue, onChange: onChangeProp },
      { defaultValue: "", valuePropName: "value", trigger: "onChange" },
    );

    // 使用 ahooks useBoolean 管理密码显示状态
    const [showPassword, { toggle: togglePassword }] = useBoolean(false);

    const isPassword = variant === "input" && type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasValue = value !== undefined && value !== "";
    const showClear = allowClear && hasValue && !disabled && variant === "input";

    const handleClear = () => {
      onClear?.();
      setValue("");
    };

    // 基础样式
    const baseClasses = useMemo(
      () => `
        w-full rounded-md border bg-card
        transition-all duration-200 ease-out
        placeholder:text-faint
        disabled:cursor-not-allowed disabled:bg-subtle disabled:text-faint
        ${sizeMap[size]}
        ${prefixIcon ? "pl-9" : ""}
        ${variant === "input" && (suffixIcon || showClear || isPassword) ? "pr-9" : ""}
        ${
          error
            ? "border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-red-50/30 dark:bg-red-950/10"
            : "border-edge focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent hover:border-secondary"
        }
        ${variant === "textarea" ? "py-2.5 resize-y" : ""}
        ${inputClassName}
      `,
      [
        size,
        prefixIcon,
        suffixIcon,
        showClear,
        isPassword,
        error,
        variant,
        inputClassName,
      ],
    );

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            className={`mb-1.5 block text-[13px] font-medium text-primary ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <div className={`relative ${variant === "input" ? "flex items-center" : ""}`}>
          {/* 前缀 */}
          {prefixIcon && (
            <div
              className={`absolute left-3 flex items-center text-faint ${variant === "textarea" ? "top-3" : ""}`}
            >
              {prefixIcon}
            </div>
          )}

          {/* 输入框 */}
          {variant === "textarea" ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={disabled}
              rows={rows}
              className={baseClasses}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={disabled}
              className={baseClasses}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {/* 清除按钮 / 密码切换 / 后缀（仅 input 模式） */}
          {variant === "input" && (
            <div className="absolute right-3 flex items-center gap-1.5">
              {showClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full p-0.5 text-faint transition-colors hover:bg-subtle hover:text-secondary"
                >
                  <BiX size={16} />
                </button>
              )}

              {isPassword && (
                <button
                  type="button"
                  onClick={togglePassword}
                  className="rounded p-0.5 text-faint transition-colors hover:text-secondary"
                >
                  {showPassword ? <BiHide size={16} /> : <BiShow size={16} />}
                </button>
              )}

              {suffixIcon && !showClear && !isPassword && (
                <span className="text-faint">{suffixIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && errorMessage && (
          <p className="mt-1.5 text-[13px] text-red-500">{errorMessage}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
