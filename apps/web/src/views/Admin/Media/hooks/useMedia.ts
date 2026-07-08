import { useMemo } from "react";
import { useDebounce, useRequest } from "ahooks";
import {
  getWorksPage,
  getDomains,
  getCategoriesPage,
  updateWork,
  type GetWorksParams,
} from "@/api/web";
import type { FilterState } from "../types";

export function useMedia(filters: FilterState, currentPage: number, pageSize: number) {
  // 防抖后的关键词
  const debouncedKeyword = useDebounce(filters.keyword, { wait: 500 });

  // 获取域列表
  const { data: domains = [] } = useRequest(async () => {
    const res = await getDomains();
    return res.data;
  });

  // 获取分类列表
  const { data: categories = [] } = useRequest(
    async () => {
      const params: { limit: number; domain?: string } = { limit: 100 };
      if (filters.domain) {
        params.domain = filters.domain;
      }
      const res = await getCategoriesPage(params);
      return res.data;
    },
    {
      refreshDeps: [filters.domain],
    },
  );

  // 获取媒体列表
  const {
    data: worksData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const params: GetWorksParams = {
        page: currentPage,
        limit: pageSize,
        keyword: debouncedKeyword || undefined,
        order: { create_time: "DESC" },
      };

      if (filters.domain) {
        params.domain = filters.domain;
      }
      if (filters.category) {
        params.category = filters.category;
      }

      const res = await getWorksPage(params);
      let data = res.data;

      // 前端过滤 state
      if (filters.state !== "") {
        const stateValue = Number(filters.state);
        data = data.filter((work) => work.state === stateValue);
      }

      return {
        list: data,
        total: res.meta.total,
      };
    },
    {
      refreshDeps: [currentPage, filters.domain, filters.category, filters.state, debouncedKeyword],
    },
  );

  const works = worksData?.list || [];
  const total = worksData?.total || 0;

  // 名称查找映射
  const domainNameMap = useMemo(() => {
    return new Map(domains.map((d) => [d.domain, d.name]));
  }, [domains]);

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((c) => [c.category, c.name]));
  }, [categories]);

  const getDomainName = (domain: string) => domainNameMap.get(domain) || domain;
  const getCategoryName = (category: string) => categoryNameMap.get(category) || category;

  // 选项数据
  const domainOptions = useMemo(
    () => [
      ...domains.map((d) => ({ value: d.domain, label: d.name })),
    ],
    [domains],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "全部分类" },
      ...categories
        .filter((c) => !filters.domain || c.domain === filters.domain)
        .map((c) => ({ value: c.category, label: c.name })),
    ],
    [categories, filters.domain],
  );

  return {
    works,
    total,
    loading,
    domains,
    categories,
    domainOptions,
    categoryOptions,
    getDomainName,
    getCategoryName,
    refresh,
    updateWork,
  };
}
