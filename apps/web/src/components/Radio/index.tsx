import React from "react";
import { useControllableValue } from "ahooks";

const cx = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(" ");

// ==================== Radio 单选框 ====================

export interface RadioProps {
  /** 是否选中 */
  checked?: boolean;
  /** 默认选中 */
  defaultChecked?: boolean;
  /** 变化回调 */
  onChange?: (checked: boolean) => void;
  /** 单选框值（用于 Group） */
  value?: string | number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签 */
  children?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

export const Radio: React.FC<RadioProps> = (props) => {
  // value 在 RadioProps 中保留以保持 API 一致性（Group 模式下需要），单 Radio 实际不使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { disabled = false, value: _value, children, className = "" } = props;

  const [checked, setChecked] = useControllableValue<boolean>(props, {
    defaultValue: false,
    valuePropName: "checked",
    trigger: "onChange",
  });

  const handleChange = () => {
    if (disabled) return;
    setChecked(!checked);
  };

  return (
    <label
      className={cx(
        "group relative inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <span
        className={cx(
          "relative flex items-center justify-center shrink-0 w-4 h-4 rounded-full border",
          "transition-colors duration-200 ease-out",
          "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent",
          checked
            ? "border-accent bg-card"
            : "border-edge bg-card",
          !disabled && !checked && "group-hover:border-secondary"
        )}
      >
        <input
          type="radio"
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        {/* Inner Dot */}
        <span
          className={cx(
            "w-2 h-2 rounded-full bg-accent",
            "transition-transform duration-200 ease-out",
            checked ? "scale-100" : "scale-0"
          )}
        />
      </span>
      {children && (
        <span className="text-[14px] text-primary select-none">
          {children}
        </span>
      )}
    </label>
  );
};

// ==================== Radio.Group 单选组 ====================

export interface RadioOption {
  label: React.ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** 当前选中的值 */
  value?: string | number;
  /** 默认值 */
  defaultValue?: string | number;
  /** 选项列表 */
  options?: RadioOption[];
  /** 变化回调 */
  onChange?: (value: string | number) => void;
  /** 是否禁用整个组 */
  disabled?: boolean;
  /** 布局方向 */
  direction?: "horizontal" | "vertical";
  /** 自定义类名 */
  className?: string;
  /** 子元素（Radio 组件） */
  children?: React.ReactNode;
  /** 选项按钮样式 */
  optionType?: "default" | "button";
  /** 按钮大小 */
  size?: "sm" | "md" | "lg";
}

export const RadioGroup: React.FC<RadioGroupProps> = (props) => {
  const {
    options,
    disabled = false,
    direction = "horizontal",
    className = "",
    children,
    optionType = "default",
    size = "md",
  } = props;

  const [currentValue, setCurrentValue] = useControllableValue<string | number | undefined>(props, {
    defaultValue: props.defaultValue,
    valuePropName: "value",
    trigger: "onChange",
  });

  const handleChange = (newValue: string | number) => {
    if (disabled) return;
    setCurrentValue(newValue);
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-sm",
  };

  if (optionType === "button") {
    return (
      <div
        className={cx(
          "inline-flex rounded bg-subtle p-0.5",
          className
        )}
      >
        {options?.map((option) => {
          const isSelected = currentValue === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handleChange(option.value)}
              className={cx(
                "rounded-sm",
                sizeClasses[size],
                isSelected
                  ? "bg-card text-primary shadow-2xs-soft"
                  : "text-secondary hover:text-primary",
                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex",
        direction === "vertical" ? "flex-col gap-2" : "flex-wrap gap-4",
        className
      )}
    >
      {options ? (
        options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            checked={currentValue === option.value}
            onChange={() => handleChange(option.value)}
            disabled={disabled || option.disabled}
          >
            {option.label}
          </Radio>
        ))
      ) : (
        React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const radioChild = child as React.ReactElement<RadioProps>;
          return React.cloneElement(radioChild, {
            checked: currentValue === radioChild.props.value,
            onChange: () => handleChange(radioChild.props.value!),
            disabled: disabled || radioChild.props.disabled,
          });
        })
      )}
    </div>
  );
};

(Radio as unknown as { Group: typeof RadioGroup }).Group = RadioGroup;

export default Radio;
