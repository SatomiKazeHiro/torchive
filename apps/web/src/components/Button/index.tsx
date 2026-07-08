import React from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { cn } from "../utils/common";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮类型 */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  /** 按钮大小 */
  size?: "sm" | "md" | "lg";
  /** 加载状态 */
  loading?: boolean;
  /** 加载文字 */
  loadingText?: string;
  /** 是否块级按钮 */
  block?: boolean;
  /** 图标（左侧） */
  icon?: React.ReactNode;
  /** 图标（右侧） */
  iconRight?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 按钮形状 */
  shape?: "default" | "circle" | "round";
}

const variantMap = {
  primary: `
    bg-accent text-on-accent border border-transparent
    hover:opacity-90 active:opacity-80
    focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-page
    shadow-2xs
  `,
  secondary: `
    bg-card text-primary border border-edge
    hover:bg-subtle hover:border-secondary hover:text-primary
    active:bg-subtle
    focus-visible:ring-2 focus-visible:ring-secondary
    shadow-2xs-soft
  `,
  outline: `
    bg-transparent border border-edge text-secondary
    hover:bg-subtle hover:text-primary hover:border-secondary
    active:bg-subtle
    focus-visible:ring-2 focus-visible:ring-secondary
  `,
  ghost: `
    bg-transparent text-secondary
    hover:bg-subtle hover:text-primary
    active:bg-subtle
    focus-visible:ring-2 focus-visible:ring-secondary
  `,
  danger: `
    bg-red-50 text-red-600 border border-transparent
    hover:bg-red-100 active:bg-red-200
    dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:active:bg-red-900/80
    focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-page
  `,
  link: `
    bg-transparent text-secondary
    hover:text-primary hover:underline
    active:text-accent
    focus-visible:ring-2 focus-visible:ring-secondary
    underline-offset-4
    p-0 h-auto
  `,
};

const sizeMap = {
  sm: "px-3 py-1.5 text-xs h-8",
  md: "px-4 py-2 text-sm h-9",
  lg: "px-5 py-2.5 text-base h-11",
};

const shapeMap = {
  default: "rounded-md",
  circle: "rounded-full aspect-square p-0 flex items-center justify-center",
  round: "rounded-full",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      block = false,
      icon,
      iconRight,
      className = "",
      shape = "default",
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(`
          relative inline-flex items-center justify-center
          font-medium transition-all duration-200
          outline-none select-none
          ${block ? "w-full flex" : "inline-flex"}
          ${isDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
          ${variantMap[variant]}
          ${sizeMap[size]}
          ${shapeMap[shape]}
          ${className}
        `)}
        {...rest}
      >
        {loading && (
          <BiLoaderAlt className="animate-spin mr-2" />
        )}
        {!loading && icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading && iconRight && <span className={children ? "ml-2" : ""}>{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
