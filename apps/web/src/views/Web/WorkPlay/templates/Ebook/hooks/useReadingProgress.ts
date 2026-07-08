/**
 * 阅读进度管理 Hook
 * 用于保存和恢复阅读进度
 */
import { useCallback, useRef, useEffect } from "react";
import type { ReadingProgress } from "../types";

const STORAGE_KEY = "ebook-reading-progress";

/** 从 localStorage 读取进度 */
function readProgressFromStorage(): Record<string, ReadingProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/** 保存进度到 localStorage */
function saveProgressToStorage(progress: Record<string, ReadingProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save reading progress:", e);
  }
}

interface UseReadingProgressOptions {
  workId: string | null;
}

interface UseReadingProgressReturn {
  /** 获取指定作品的进度 */
  getProgress: (id?: string) => ReadingProgress | null;
  /** 保存当前作品的进度 */
  saveProgress: (progress: Partial<Omit<ReadingProgress, "workId" | "lastReadTime">>) => void;
  /** 清除指定作品的进度 */
  clearProgress: (id?: string) => void;
  /** 获取所有进度记录 */
  getAllProgress: () => ReadingProgress[];
}

export function useReadingProgress(options: UseReadingProgressOptions): UseReadingProgressReturn {
  const { workId } = options;
  const progressCacheRef = useRef<Record<string, ReadingProgress>>({});

  // 初始化时读取进度
  useEffect(() => {
    progressCacheRef.current = readProgressFromStorage();
  }, []);

  /** 获取进度 */
  const getProgress = useCallback(
    (id?: string) => {
      const targetId = id || workId;
      if (!targetId) return null;
      return progressCacheRef.current[targetId] || null;
    },
    [workId]
  );

  /** 保存进度 */
  const saveProgress = useCallback(
    (progress: Partial<Omit<ReadingProgress, "workId" | "lastReadTime">>) => {
      if (!workId) return;

      const existing = progressCacheRef.current[workId];
      const newProgress: ReadingProgress = {
        workId,
        chapterIndex: progress.chapterIndex ?? existing?.chapterIndex ?? 0,
        fileIndex: progress.fileIndex ?? existing?.fileIndex ?? 0,
        progress: progress.progress ?? existing?.progress ?? 0,
        scrollTop: progress.scrollTop ?? existing?.scrollTop ?? 0,
        lastReadTime: Date.now(),
      };

      progressCacheRef.current[workId] = newProgress;
      saveProgressToStorage(progressCacheRef.current);
    },
    [workId]
  );

  /** 清除进度 */
  const clearProgress = useCallback(
    (id?: string) => {
      const targetId = id || workId;
      if (!targetId) return;

      delete progressCacheRef.current[targetId];
      saveProgressToStorage(progressCacheRef.current);
    },
    [workId]
  );

  /** 获取所有进度 */
  const getAllProgress = useCallback(() => {
    return Object.values(progressCacheRef.current).sort(
      (a, b) => b.lastReadTime - a.lastReadTime
    );
  }, []);

  return {
    getProgress,
    saveProgress,
    clearProgress,
    getAllProgress,
  };
}
