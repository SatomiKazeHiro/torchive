import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <header className="rounded-[14px] border border-subtle-ash bg-white shadow-[0_0_0_1px_oklab(0.145_-0.00000143796_0.00000340492_/_0.1)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[18px] leading-[1.33] font-semibold tracking-[-0.45px] text-deep-black dark:text-zinc-100">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-[1.43] text-midtone-gray dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </header>
  );
}
