import React from "react";

interface OverflowableBoxProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export function OverflowableBox({
  children,
  enabled = false,
  className = "",
}: OverflowableBoxProps) {
  // 如果未开启省略，原样返回
  if (!enabled) {
    return <span className={className}>{children}</span>;
  }

  // 1. block/inline-block + w-full + truncate 是截断的核心
  // 2. title 仅在纯文本时有效，增强 A11Y
  const textTitle = typeof children === "string" || typeof children === "number" 
    ? String(children) 
    : undefined;

  return (
    <span
      className={`block w-full truncate ${className}`}
      title={textTitle}
    >
      {children}
    </span>
  );
}

export default OverflowableBox;