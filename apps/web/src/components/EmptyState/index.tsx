import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** CTA 链接/按钮内容（必须自行处理 to / onClick 等） */
  action?: ReactNode;
  className?: string;
}

/**
 * 空状态卡片：圆角卡 + 居中图标 + 标题 + 描述 + CTA。
 * 主题色由 bg-card / text-primary / text-muted / bg-accent 等语义化类承载。
 */
export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={
        "rounded-xl border border-edge-subtle bg-card p-16 text-center " + (className ?? "")
      }
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-subtle">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-medium text-primary">{title}</h3>
      {description && <p className="mb-6 text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
