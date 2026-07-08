import { webHttp, TsResponse } from "./shared";

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  domain?: string;
  keyword?: string;
  order?: Record<string, "ASC" | "DESC">;
  withStats?: boolean;
}

export function getCategories(domain?: string) {
  return webHttp.post<TsResponse<Category>>("/categories/page", {
    limit: 100,
    domain,
  });
}

export function getCategoriesPage(params: GetCategoriesParams = {}) {
  return webHttp.post<TsResponse<Category>>("/categories/page", {
    page: params.page || 1,
    limit: params.limit || 100,
    domain: params.domain,
    keyword: params.keyword,
    order: params.order || { state: "DESC" },
    withStats: params.withStats,
  });
}

export function createCategory(data: Omit<Category, "exist">) {
  return webHttp.post<Category>("/categories", data as Record<string, unknown>);
}

export function updateCategory(
  hash_id: string,
  data: Partial<Omit<Category, "hash_id" | "category" | "domain">>
) {
  return webHttp.patch<Category>(`/categories/${hash_id}`, data as Record<string, unknown>);
}

export function deleteCategory(hash_id: string) {
  return webHttp.del<void>(`/categories/${hash_id}`);
}

export function getCategory(hash_id: string) {
  return webHttp.get<Category>(`/categories/${hash_id}`);
}