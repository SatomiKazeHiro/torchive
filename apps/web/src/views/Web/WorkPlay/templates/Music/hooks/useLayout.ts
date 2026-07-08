import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "music-player-layout-mode";

export type LayoutMode = "left-right" | "right-left";

/**
 * 布局管理 Hook
 * 
 * 功能：
 * - 管理播放页面布局模式（左右/右左）
 * - 持久化布局设置到 localStorage
 * - 提供布局切换方法
 */
export function useLayout() {
  // 从 localStorage 读取保存的布局，默认左-右布局
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "left-right";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LayoutMode;
      // 只接受左右布局
      return saved === "right-left" ? "right-left" : "left-right";
    } catch {
      return "left-right";
    }
  });

  // 保存到 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, layoutMode);
    } catch {
      // 忽略存储错误
    }
  }, [layoutMode]);

  // 切换布局（仅左右互换）
  const cycleLayout = useCallback(() => {
    setLayoutMode((current) => (current === "left-right" ? "right-left" : "left-right"));
  }, []);

  // 设置特定布局
  const setLayout = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
  }, []);

  // 歌单是否在左侧
  const isPlaylistFirst = layoutMode === "left-right";

  return {
    layoutMode,
    cycleLayout,
    setLayout,
    isPlaylistFirst,
  };
}
