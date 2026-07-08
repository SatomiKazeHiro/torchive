import { webHttp, TsResponse, TsItemResponse } from "./shared";

export function createUserWatchLater(data: { uid: string; work_hash_id: string }) {
  return webHttp.post<TsItemResponse<UserWatchLater>>(
    "/user-watch-laters",
    data as Record<string, unknown>,
  );
}

export function getUserWatchLaters(uid: string) {
  return webHttp.get<TsResponse<UserWatchLater>>("/user-watch-laters", {
    uid,
    limit: 100,
  } as Record<string, unknown>);
}

export function getUserWatchLatersPage(params: { uid: string; page?: number; limit?: number }) {
  return webHttp.post<TsResponse<UserWatchLater>>("/user-watch-laters/page", {
    uid: params.uid,
    page: params.page || 1,
    limit: params.limit || 20,
  } as Record<string, unknown>);
}

export function deleteUserWatchLater(id: number) {
  return webHttp.del<void>(`/user-watch-laters/${id}`);
}

export function clearUserWatchLaters(uid: string) {
  return webHttp.del<void>(`/user-watch-laters/user/${uid}`);
}
