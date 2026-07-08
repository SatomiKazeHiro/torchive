import { useRef, useState, useEffect, useCallback } from "react";
import { BiSun, BiMoon, BiDesktop } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof BiSun }[] = [
  { value: "light", label: "浅色", Icon: BiSun },
  { value: "dark", label: "深色", Icon: BiMoon },
  { value: "system", label: "跟随系统", Icon: BiDesktop },
];

/**
 * 主题切换器：浅色 / 深色 / 跟随系统
 *
 * 设计：极简黑白风格，三态下拉，选中态用 accent 高亮。
 */
export default function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // 卸载清理
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 150);
  }, []);

  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[2];
  const CurrentIcon = current.Icon;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        title="切换主题"
        aria-label="切换主题"
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1.5 text-muted transition-colors hover:bg-subtle hover:text-primary"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-32 overflow-hidden rounded-lg border border-edge bg-card shadow-2xs"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const active = value === mode;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-subtle font-medium text-primary"
                    : "text-secondary hover:bg-subtle",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
