import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { findChapterIndexByFile, findPageIndexInChapter } from "./utils";
import type { ChapterUnit } from "./types";

/**
 * 漫画播放页 URL 状态管理
 *
 * URL 编码: ?chapter=<chapterKey>&page=<n>
 * - chapter 用 ChapterUnit.key(如 unit_assets / unit_section_0 / unit_orphan)
 *   短且稳定,直接做 URL 值不需要再编码
 * - page 用 1-based 数字(可读性优先,便于人脑 debug)
 *
 * 状态推算优先级(分别独立):
 *   chapter:
 *     1. URL 上合法且能匹配到 unit.key → 用它
 *     2. initialFilePath 命中某 unit 的 files → 用它并回写 URL
 *     3. 第一个 unit
 *   page:
 *     1. URL 上合法且在 [1, totalPages] 范围内 → 用它
 *     2. initialFilePath 命中当前 chapter 的某一页 → 用它
 *     3. 1
 *
 * URL 缺/失效时由唯一一处 useEffect 静默回写,replace 不污染历史栈。
 * 注意:漫画条漫模式滚动时的 visibleImageIndex 不入 URL(太吵),
 * 仅在 single 模式翻页和章节切换时同步。
 */
export function useMangaPlayState(chapterUnits: ChapterUnit[], initialFilePath?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChapter = searchParams.get("chapter");
  const urlPage = searchParams.get("page");

  // 校验并兜底当前章节索引
  const currentChapterIndex = useMemo(() => {
    if (chapterUnits.length === 0) return 0;
    if (urlChapter) {
      const idx = chapterUnits.findIndex((u) => u.key === urlChapter);
      if (idx >= 0) return idx;
    }
    if (initialFilePath) {
      const idx = findChapterIndexByFile(chapterUnits, initialFilePath);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [chapterUnits, urlChapter, initialFilePath]);

  const currentChapter = chapterUnits[currentChapterIndex] ?? null;

  // 校验并兜底当前页码(依赖已确定的章节)
  const currentPage = useMemo(() => {
    if (!currentChapter) return 1;
    const totalPages = currentChapter.files.length;
    if (urlPage) {
      const n = parseInt(urlPage, 10);
      if (Number.isFinite(n) && n >= 1 && n <= totalPages) return n;
    }
    if (initialFilePath) {
      const p = findPageIndexInChapter(currentChapter, initialFilePath);
      if (p >= 1) return p;
    }
    return 1;
  }, [currentChapter, urlPage, initialFilePath]);

  // URL 与 state 偏离时静默回写
  useEffect(() => {
    if (chapterUnits.length === 0) return;
    const wantChapter = chapterUnits[currentChapterIndex]?.key ?? "";
    const wantPage = String(currentPage);
    if (urlChapter === wantChapter && urlPage === wantPage) return;
    const next = new URLSearchParams(searchParams);
    next.set("chapter", wantChapter);
    next.set("page", wantPage);
    setSearchParams(next, { replace: true });
  }, [
    chapterUnits,
    currentChapterIndex,
    currentPage,
    urlChapter,
    urlPage,
    searchParams,
    setSearchParams,
  ]);

  const writeState = useCallback(
    (chapterIdx: number, page: number) => {
      const unit = chapterUnits[chapterIdx];
      if (!unit) return;
      const totalPages = unit.files.length;
      const clampedPage = Math.max(1, Math.min(totalPages, page));
      const next = new URLSearchParams(searchParams);
      next.set("chapter", unit.key);
      next.set("page", String(clampedPage));
      setSearchParams(next, { replace: true });
    },
    [chapterUnits, searchParams, setSearchParams],
  );

  const setChapterIndex = useCallback((idx: number) => writeState(idx, 1), [writeState]);

  const setPage = useCallback(
    (page: number) => writeState(currentChapterIndex, page),
    [writeState, currentChapterIndex],
  );

  return {
    currentChapterIndex,
    currentPage,
    setChapterIndex,
    setPage,
  };
}
