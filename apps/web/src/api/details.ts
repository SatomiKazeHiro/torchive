import { webHttp, TsResponse } from "./shared";

// 复用 db-instance 里的类型，消除与 web.ts 旧 Detail 接口的重复
export type { WorkDetail, EntitiesJson } from "@/types/db-instance";
import type { WorkDetail } from "@/types/db-instance";

/** 旧名 Detail = 新名 WorkDetail，保留向后兼容 */
export type Detail = WorkDetail;

export interface GetDetailsParams {
  page?: number;
  limit?: number;
  keyword?: string;
}

export function getDetail(hash_id: string) {
  return webHttp.get<Detail>(`/details/${hash_id}`);
}

export function getDetailsPage(params: GetDetailsParams = {}) {
  return webHttp.post<TsResponse<Detail>>("/details/page", {
    page: params.page || 1,
    limit: params.limit || 10,
    keyword: params.keyword,
  });
}