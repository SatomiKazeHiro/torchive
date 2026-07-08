import { createInstance } from "./request";

export const webHttp = createInstance({ baseURL: "/ts-api" });

export interface Meta {
  limit: number;
  page: number;
  total: number;
  totalPages?: number;
  random?: boolean;
}

/** 分页列表响应 */
export interface TsResponse<T> {
  data: T[];
  meta: Meta;
}

/** 单条记录响应（register/login/getUser 等） */
export interface TsItemResponse<T> {
  data: T;
  meta: Meta;
}