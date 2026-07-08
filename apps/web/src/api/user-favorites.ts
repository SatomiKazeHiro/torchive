import { webHttp, TsResponse, TsItemResponse } from "./shared";

export function createUserFavorite(data: { uid: string; work_hash_id: string }) {
  return webHttp.post<TsItemResponse<UserFavorite>>(
    "/user-favorites",
    data as Record<string, unknown>,
  );
}

export function getUserFavorites(uid: string) {
  return webHttp.get<TsResponse<UserFavorite>>("/user-favorites", {
    uid,
    limit: 100,
  } as Record<string, unknown>);
}

export function getUserFavoritesPage(params: { uid: string; page?: number; limit?: number }) {
  return webHttp.post<TsResponse<UserFavorite>>("/user-favorites/page", {
    uid: params.uid,
    page: params.page || 1,
    limit: params.limit || 20,
  } as Record<string, unknown>);
}

export function deleteUserFavorite(id: number) {
  return webHttp.del<void>(`/user-favorites/${id}`);
}

export function clearUserFavorites(uid: string) {
  return webHttp.del<void>(`/user-favorites/user/${uid}`);
}
