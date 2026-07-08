import { webHttp, TsResponse, TsItemResponse } from "./shared";

export interface GetWorkListParams {
  page?: number;
  limit?: number;
  domain?: string;
  category?: string;
  order?: Record<string, "ASC" | "DESC">;
}

export interface GetWorkListByCategoryParams {
  page?: number;
  limit?: number;
  domain: string;
  category: string;
  order?: Record<string, "ASC" | "DESC">;
}

export interface GetWorksParams {
  page?: number;
  limit?: number;
  domain?: string;
  category?: string;
  keyword?: string;
  order?: Record<string, "ASC" | "DESC">;
}

export function getWorkPage() {
  return webHttp.post<TsResponse<Work>>("/works/page", { random: true });
}

export function getLatestWork(domain: string, category?: string) {
  return webHttp.post<TsResponse<Work>>("/works/page", {
    // TODO: 改成 update_time 降序
    order: { create_time: "DESC" },
    domain,
    category,
    limit: 12,
  });
}

export function getWorkList(params: GetWorkListParams = {}) {
  return webHttp.post<TsResponse<Work>>("/works/page", {
    page: params.page || 1,
    limit: params.limit || 30,
    domain: params.domain === "all" ? undefined : params.domain,
    category: params.category === "all" ? undefined : params.category,
    order: params.order || { create_time: "DESC" },
  });
}

export function getWorkListByCategory(params: GetWorkListByCategoryParams) {
  return webHttp.post<TsResponse<Work>>("/works/page", {
    page: params.page || 1,
    limit: params.limit || 30,
    domain: params.domain,
    category: params.category,
    order: params.order || { create_time: "DESC" },
  });
}

export function getWorksPage(params: GetWorksParams = {}) {
  return webHttp.post<TsResponse<Work>>("/works/page", {
    page: params.page || 1,
    limit: params.limit || 20,
    domain: params.domain,
    category: params.category,
    keyword: params.keyword,
    order: params.order || { create_time: "DESC" },
  });
}

export function getWork(hash_id: string) {
  return webHttp.get<TsItemResponse<Work>>(`/works/${hash_id}`);
}

export function updateWork(hash_id: string, data: Partial<Pick<Work, "state">>) {
  return webHttp.patch<Work>(`/works/${hash_id}`, data as Record<string, unknown>);
}