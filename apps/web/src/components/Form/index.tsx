import React from "react";

// ==================== Form 组件 ====================

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** 表单布局 */
  layout?: "horizontal" | "vertical" | "inline";
  /** 标签对齐方式（horizontal布局有效） */
  labelAlign?: "left" | "right";
  /** 标签宽度（horizontal布局有效） */
  labelWidth?: number | string;
  /** 是否显示冒号 */
  colon?: boolean;
  /** 提交回调 */
  onFinish?: (values: Record<string, unknown>) => void;
  /** 提交失败回调 */
  onFinishFailed?: (errors: FormFieldError[]) => void;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children: React.ReactNode;
}

export interface FormFieldError {
  name: string;
  errors: string[];
}

export interface FormContextValue {
  layout: "horizontal" | "vertical" | "inline";
  labelAlign: "left" | "right";
  labelWidth?: number | string;
  colon: boolean;
  registerField: (name: string, rules?: ValidationRule[]) => void;
  unregisterField: (name: string) => void;
  setFieldValue: (name: string, value: unknown) => void;
  getFieldValue: (name: string) => unknown;
  validateField: (name: string) => Promise<string[]>;
}

export interface ValidationRule {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: unknown) => Promise<void> | void;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export const Form: React.FC<FormProps> = ({
  layout = "vertical",
  labelAlign = "right",
  labelWidth,
  colon = true,
  onFinish,
  onFinishFailed,
  className = "",
  children,
  onSubmit,
  ...rest
}) => {
  const fieldsRef = React.useRef<Map<string, { rules?: ValidationRule[]; value?: unknown }>>(new Map());

  const registerField = React.useCallback((name: string, rules?: ValidationRule[]) => {
    fieldsRef.current.set(name, { rules });
  }, []);

  const unregisterField = React.useCallback((name: string) => {
    fieldsRef.current.delete(name);
  }, []);

  const setFieldValue = React.useCallback((name: string, value: unknown) => {
    const field = fieldsRef.current.get(name);
    if (field) {
      field.value = value;
    }
  }, []);

  const getFieldValue = React.useCallback((name: string) => {
    return fieldsRef.current.get(name)?.value;
  }, []);

  const validateField = React.useCallback(async (name: string): Promise<string[]> => {
    const field = fieldsRef.current.get(name);
    if (!field?.rules) return [];

    const errors: string[] = [];
    const value = field.value;

    for (const rule of field.rules) {
      if (rule.required && (value === undefined || value === "" || value === null)) {
        errors.push(rule.message || "此字段为必填项");
      }
      if (rule.min !== undefined && typeof value === "string" && value.length < rule.min) {
        errors.push(rule.message || `长度不能少于 ${rule.min} 个字符`);
      }
      if (rule.max !== undefined && typeof value === "string" && value.length > rule.max) {
        errors.push(rule.message || `长度不能超过 ${rule.max} 个字符`);
      }
      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        errors.push(rule.message || "格式不正确");
      }
      if (rule.validator) {
        try {
          await rule.validator(value);
        } catch (error) {
          errors.push((error as Error).message || "验证失败");
        }
      }
    }

    return errors;
  }, []);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const values: Record<string, unknown> = {};
    const errors: FormFieldError[] = [];

    for (const [name, field] of fieldsRef.current) {
      values[name] = field.value;
      const fieldErrors = await validateField(name);
      if (fieldErrors.length > 0) {
        errors.push({ name, errors: fieldErrors });
      }
    }

    if (errors.length > 0) {
      onFinishFailed?.(errors);
    } else {
      onFinish?.(values);
    }

    onSubmit?.(e);
  };

  const contextValue: FormContextValue = {
    layout,
    labelAlign,
    labelWidth,
    colon,
    registerField,
    unregisterField,
    setFieldValue,
    getFieldValue,
    validateField,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={`
          ${layout === "inline" ? "flex flex-wrap gap-4 items-start" : ""}
          ${className}
        `}
        {...rest}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

// ==================== Form.Item 组件 ====================

export interface FormItemProps {
  /** 字段名 */
  name?: string;
  /** 标签 */
  label?: React.ReactNode;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 是否必填 */
  required?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children: React.ReactNode;
  /** 帮助文本 */
  help?: React.ReactNode;
  /** 额外的提示信息 */
  extra?: React.ReactNode;
}

export const FormItem: React.FC<FormItemProps> = ({
  name,
  label,
  rules = [],
  required = false,
  className = "",
  children,
  help,
  extra,
}) => {
  const context = React.useContext(FormContext);
  const [errors, setErrors] = React.useState<string[]>([]);

  // 注册字段（hooks 必须在早期 return 之前调用）
  // 依赖只跟踪 name/required；rules 引用每次渲染变化，故有意忽略以避免重复注册
  React.useEffect(() => {
    if (context && name) {
      const mergedRules = required ? [{ required: true, message: "此字段为必填项" }, ...rules] : rules;
      context.registerField(name, mergedRules);
      return () => context.unregisterField(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, name, required]);

  // 如果没有在 Form 内，简化渲染
  if (!context) {
    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-primary mb-2">
            {label}
            {required && <span className="text-callout-red ml-1">*</span>}
          </label>
        )}
        {children}
      </div>
    );
  }

  const { layout, labelAlign, labelWidth, colon } = context;

  const labelStyle: React.CSSProperties = {};
  if (layout === "horizontal" && labelWidth) {
    labelStyle.width = typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth;
  }

  const renderLabel = () => {
    if (!label) return null;

    return (
      <label
        style={labelStyle}
        className={`
          text-sm font-medium text-primary
          ${layout === "horizontal" ? `flex-shrink-0 h-10 flex items-center ${labelAlign === "right" ? "text-right" : "text-left"}` : "block mb-2"}
          ${layout === "inline" ? "mr-2 mb-0" : ""}
        `}
      >
        {label}
        {colon && layout === "horizontal" && <span className="mx-1">:</span>}
        {required && <span className="text-callout-red ml-0.5">*</span>}
      </label>
    );
  };

  // 克隆子元素，注入 value 和 onChange
  interface FormChildProps {
  className?: string;
  onChange?: (e: unknown) => void;
  onBlur?: () => void;
  [key: string]: unknown;
}

const clonedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || !name) return child;

    const childElement = child as React.ReactElement<FormChildProps>;
    const hasError = errors.length > 0;

    return React.cloneElement(childElement, {
      className: `
        ${childElement.props.className || ""}
        ${hasError ? "border-callout-red focus:ring-callout-red focus:border-callout-red" : ""}
      `,
      onChange: (e: unknown) => {
        const target = e && typeof e === "object" && "target" in e ? (e as { target: { value: unknown } }).target : null;
        const value = target ? target.value : e;
        context.setFieldValue(name, value);
        // 清除错误
        setErrors([]);
        // 调用原始的 onChange
        if (childElement.props.onChange) {
          childElement.props.onChange(e);
        }
      },
      onBlur: async () => {
        if (name) {
          const fieldErrors = await context.validateField(name);
          setErrors(fieldErrors);
        }
        if (childElement.props.onBlur) {
          childElement.props.onBlur();
        }
      },
    });
  });

  return (
    <div
      className={`
        ${layout === "horizontal" ? "flex items-center gap-4 mb-5 min-h-10" : ""}
        ${layout === "vertical" ? "mb-5" : ""}
        ${layout === "inline" ? "flex items-center mb-5" : ""}
        ${className}
      `}
    >
      {renderLabel()}
      <div className={`flex-1 min-w-0 ${layout === "horizontal" ? "" : ""}`}>
        {clonedChildren}
        {(help || errors.length > 0 || extra) && (
          <div className="mt-1.5 space-y-1">
            {help && !errors.length && (
              <p className="text-xs text-muted">{help}</p>
            )}
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-callout-red animate-in slide-in-from-top-1 fade-in duration-200">
                {error}
              </p>
            ))}
            {extra && <div className="text-xs text-faint">{extra}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;
