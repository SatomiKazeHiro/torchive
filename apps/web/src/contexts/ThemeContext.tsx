import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

/**
 * 主题模式
 * - light: 强制浅色
 * - dark: 强制深色
 * - system: 跟随操作系统
 */
export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "torchive_theme";

interface ThemeContextValue {
  /** 用户选择的主题模式（含 system） */
  mode: ThemeMode;
  /** 当前实际生效的明暗（system 时为解析后的实际值） */
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSavedMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* 隐私模式或 SSR 等异常 */
  }
  return "system";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(resolved: "light" | "dark") {
  const html = document.documentElement;
  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 初始值与 index.html 中的 FOUC 脚本保持一致，避免水合不一致
  const [mode, setModeState] = useState<ThemeMode>(() => readSavedMode());
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveMode(readSavedMode()));

  // 同步 class
  useEffect(() => {
    const next = resolveMode(mode);
    setResolved(next);
    applyClass(next);
  }, [mode]);

  // system 模式下监听系统偏好变化
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mql.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setModeState(next);
  }, []);

  return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
