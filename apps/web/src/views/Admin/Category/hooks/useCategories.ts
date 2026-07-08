import { useState, useEffect, useCallback } from "react";
import {
  getCategoriesPage,
  getDomains,
  createCategory,
  updateCategory,
  deleteCategory,
  GetCategoriesParams,
} from "@/api/web";
import type { CategoryWithCount } from "../types";

const DEFAULT_PAGE_SIZE = 10;

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  // 获取分类列表（支持分页）
  const fetchCategories = useCallback(async (page: number = currentPage, limit: number = pageSize) => {
    setLoading(true);
    try {
      const params: GetCategoriesParams = {
        page,
        limit,
        order: { state: "DESC" },
        withStats: true,
      };
      const res = await getCategoriesPage(params);
      
      setCategories(res.data);
      // 从响应头或数据中获取总数
      setTotal(res.meta.total || res.data.length);
    } catch (error) {
      console.error("获取分类列表失败:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 页码变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchCategories(page, pageSize);
  }, [fetchCategories, pageSize]);

  // 每页条数变化
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchCategories(1, newPageSize);
  }, [fetchCategories]);

  // 获取域列表
  const fetchDomains = useCallback(async () => {
    try {
      const res = await getDomains();
      setDomains(res.data);
    } catch (error) {
      console.error("获取域列表失败:", error);
      throw error;
    }
  }, []);

  // 创建分类
  const handleCreate = async (data: {
    hash_id: string;
    domain: string;
    category: string;
    name: string;
    page_template: string;
    work_page_template: string;
    state: number;
  }) => {
    await createCategory({
      ...data,
    });
    await fetchCategories(currentPage, pageSize);
  };

  // 更新分类
  const handleUpdate = async (
    hash_id: string,
    data: Partial<{
      name: string;
      page_template: string;
      work_page_template: string;
      state: number;
    }>
  ) => {
    // 过滤掉空字符串值，避免覆盖原有值
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== "")
    );
    await updateCategory(hash_id, filteredData);
    await fetchCategories(currentPage, pageSize);
  };

  // 删除分类
  const handleDelete = async (hash_id: string) => {
    await deleteCategory(hash_id);
    // 删除后如果当前页没有数据了，回到上一页
    const newTotal = total - 1;
    const maxPage = Math.ceil(newTotal / pageSize);
    const newPage = currentPage > maxPage && maxPage > 0 ? maxPage : currentPage;
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
    await fetchCategories(newPage, pageSize);
  };

  // 切换状态
  const handleToggleState = async (category: CategoryWithCount) => {
    await handleUpdate(category.hash_id, {
      state: category.state === 1 ? 0 : 1,
    });
  };

  // 初始化数据
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    fetchCategories(currentPage, pageSize);
    // 只在挂载时拉取一次，currentPage/pageSize 变化由调用方显式触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    categories,
    domains,
    loading,
    currentPage,
    pageSize,
    total,
    setCurrentPage,
    setPageSize,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchCategories,
    createCategory: handleCreate,
    updateCategory: handleUpdate,
    deleteCategory: handleDelete,
    toggleState: handleToggleState,
  };
}
