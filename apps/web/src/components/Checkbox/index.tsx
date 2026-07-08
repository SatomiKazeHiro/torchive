import React from "react";
import { useControllableValue } from "ahooks";
import { xor } from "es-toolkit";

const cx = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(" ");

// ==================== Checkbox 多选框 ====================

export interface CheckboxProps {
  /** 是否选中 */
  checked?: boolean;
  /** 半选状态（用于父级） */
  indeterminate?: boolean;
  /** 默认选中 */
  defaultChecked?: boolean;
  /** 变化回调 */
  onChange?: (checked: boolean) => void;
  /** 多选框值（用于 Group） */
  value?: string | number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签 */
  children?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  // value 在 CheckboxProps 中保留以保持 API 一致性（Group 模式下需要），单 Checkbox 实际不使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { indeterminate = false, disabled = false, value: _value, children, className = "" } = props;

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
          "relative flex items-center justify-center shrink-0 w-4 h-4 rounded-sm border",
          "transition-colors duration-200 ease-out",
          "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent",
          checked || indeterminate
            ? "border-accent bg-accent text-on-accent"
            : "border-edge bg-card text-transparent",
          !disabled && !checked && !indeterminate && "group-hover:border-secondary"
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        {/* Checkmark Icon */}
        <svg
          className={cx(
            "w-3 h-3 transition-transform duration-200",
            checked && !indeterminate ? "scale-100" : "scale-0 absolute"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>

        {/* Indeterminate Icon */}
        <svg
          className={cx(
            "w-3 h-3 transition-transform duration-200",
            indeterminate ? "scale-100" : "scale-0 absolute"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
        </svg>
      </span>
      {children && (
        <span className="text-[14px] text-primary select-none">
          {children}
        </span>
      )}
    </label>
  );
};

// ==================== Checkbox.Group 多选组 ====================

export interface CheckboxOption {
  label: React.ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  /** 当前选中的值数组 */
  value?: (string | number)[];
  /** 默认值 */
  defaultValue?: (string | number)[];
  /** 选项列表 */
  options?: CheckboxOption[];
  /** 变化回调 */
  onChange?: (value: (string | number)[]) => void;
  /** 是否禁用整个组 */
  disabled?: boolean;
  /** 布局方向 */
  direction?: "horizontal" | "vertical";
  /** 自定义类名 */
  className?: string;
  /** 子元素（Checkbox 组件） */
  children?: React.ReactNode;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = (props) => {
  const {
    options,
    disabled = false,
    direction = "horizontal",
    className = "",
    children,
  } = props;

  const [currentValue, setCurrentValue] = useControllableValue<(string | number)[]>(props, {
    defaultValue: props.defaultValue || [],
    valuePropName: "value",
    trigger: "onChange",
  });

  const handleChange = (optionValue: string | number) => {
    if (disabled) return;
    const newValue = xor(currentValue, [optionValue]);
    setCurrentValue(newValue);
  };

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
          <Checkbox
            key={option.value}
            value={option.value}
            checked={currentValue.includes(option.value)}
            onChange={() => handleChange(option.value)}
            disabled={disabled || option.disabled}
          >
            {option.label}
          </Checkbox>
        ))
      ) : (
        React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const checkboxChild = child as React.ReactElement<CheckboxProps>;
          const childValue = checkboxChild.props.value;
          if (childValue === undefined) return child;
          
          return React.cloneElement(checkboxChild, {
            checked: currentValue.includes(childValue),
            onChange: () => handleChange(childValue),
            disabled: disabled || checkboxChild.props.disabled,
          });
        })
      )}
    </div>
  );
};

(Checkbox as unknown as { Group: typeof CheckboxGroup }).Group = CheckboxGroup;

export default Checkbox;
