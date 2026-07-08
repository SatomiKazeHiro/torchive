import { useMemo, useState } from "react";

export interface UseTableSearchResult<T> {
  keyword: string;
  setKeyword: (value: string) => void;
  filtered: T[];
  hasKeyword: boolean;
}

/**
 * Admin 列表通用搜索：把搜索词按 `getSearchFields` 取出的字段逐个做小写包含匹配。
 *
 * @example
 *   const { keyword, setKeyword, filtered } = useTableSearch(domains, (d) => [d.domain, d.name]);
 */
export function useTableSearch<T>(
  data: T[],
  getSearchFields: (item: T) => string[]
): UseTableSearchResult<T> {
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return data;
    const k = trimmed.toLowerCase();
    return data.filter((item) =>
      getSearchFields(item).some((field) => field.toLowerCase().includes(k))
    );
  }, [data, keyword, getSearchFields]);

  return {
    keyword,
    setKeyword,
    filtered,
    hasKeyword: keyword.trim().length > 0,
  };
}