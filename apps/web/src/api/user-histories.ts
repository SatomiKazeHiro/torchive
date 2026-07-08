import { webHttp, TsResponse, TsItemResponse } from "./shared";

export function createUserHistory(data: { uid: string; work_hash_id: string; params?: string }) {
  return webHttp.post<TsItemResponse<UserHistory>>(
    "/user-histories",
    data as Record<string, unknown>,
  );
}

export function getUserHistories(uid: string) {
  return webHttp.get<TsResponse<UserHistory>>("/user-histories", {
    uid,
    limit: 100,
  } as Record<string, unknown>);
}

export function getUserHistoriesPage(params: { uid: string; page?: number; limit?: number }) {
  return webHttp.post<TsResponse<UserHistory>>("/user-histories/page", {
    uid: params.uid,
    page: params.page || 1,
    limit: params.limit || 20,
  } as Record<string, unknown>);
}

export function deleteUserHistory(id: number) {
  return webHttp.del<void>(`/user-histories/${id}`);
}

export function clearUserHistories(uid: string) {
  return webHttp.del<void>(`/user-histories/user/${uid}`);
}
