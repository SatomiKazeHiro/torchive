/**
 * 搜索功能 Hook
 */
import { useState, useCallback } from "react";
import type { SearchResult, SearchState, Paragraph } from "../types";
import { performSearch } from "../utils";

interface UseSearchOptions {
  itemHeight: number;
}

interface UseSearchReturn {
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  search: (keyword: string, paragraphs: Paragraph[]) => void;
  jumpToResult: (result: SearchResult, container: HTMLDivElement | null) => void;
  navigateResult: (direction: "prev" | "next", container: HTMLDivElement | null) => void;
  clearSearch: () => void;
}

export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const { itemHeight } = options;

  const [searchState, setSearchState] = useState<SearchState>({
    keyword: "",
    results: [],
    currentResultIndex: -1,
    isSearching: false,
  });

  // 执行搜索（至少2个字符）
  const search = useCallback(
    (keyword: string, paragraphs: Paragraph[]) => {
      // 检查关键词长度（至少2个字符）
      if (keyword.trim().length < 2) {
        setSearchState({
          keyword,
          results: [],
          currentResultIndex: -1,
          isSearching: false,
        });
        return;
      }

      setSearchState((prev) => ({ ...prev, isSearching: true, keyword }));

      // 使用 setTimeout 让 UI 先更新，避免阻塞
      setTimeout(() => {
        const results = performSearch(paragraphs, keyword);
        setSearchState({
          keyword,
          results,
          currentResultIndex: -1,
          isSearching: false,
        });
      }, 10);
    },
    []
  );

  // 跳转到指定结果
  const jumpToResult = useCallback(
    (result: SearchResult, container: HTMLDivElement | null) => {
      if (container) {
        container.scrollTop = result.paragraphIndex * itemHeight;
      }
    },
    [itemHeight]
  );

  // 导航到上一个/下一个结果
  const navigateResult = useCallback(
    (direction: "prev" | "next", container: HTMLDivElement | null) => {
      setSearchState((prev) => {
        if (prev.results.length === 0) return prev;

        let newIndex: number;
        if (direction === "prev") {
          newIndex = prev.currentResultIndex <= 0 ? 0 : prev.currentResultIndex - 1;
        } else {
          newIndex =
            prev.currentResultIndex >= prev.results.length - 1
              ? prev.results.length - 1
              : prev.currentResultIndex + 1;
        }

        if (newIndex !== prev.currentResultIndex && container) {
          const result = prev.results[newIndex];
          container.scrollTop = result.paragraphIndex * itemHeight;
        }

        return { ...prev, currentResultIndex: newIndex };
      });
    },
    [itemHeight]
  );

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchState({
      keyword: "",
      results: [],
      currentResultIndex: -1,
      isSearching: false,
    });
  }, []);

  return {
    searchState,
    setSearchState,
    search,
    jumpToResult,
    navigateResult,
    clearSearch,
  };
}
