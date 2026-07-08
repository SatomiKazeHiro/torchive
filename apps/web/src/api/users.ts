import axios from "axios";
import { webHttp, TsItemResponse } from "./shared";

export function registerUser(data: Omit<User, "uid" | "create_time" | "update_time">) {
  return webHttp.post<TsItemResponse<User>>("/users/register", data as Record<string, unknown>);
}

export function loginUser(data: { login_name: string; password: string }) {
  return webHttp.post<TsItemResponse<Omit<User, "password">>>(
    "/users/login",
    data as Record<string, unknown>
  );
}

export function getUser(uid: string) {
  return webHttp.get<TsItemResponse<Omit<User, "password">>>(`/users/${uid}`);
}

export function updateUser(
  uid: string,
  data: Partial<Omit<User, "uid" | "create_time" | "update_time">>
) {
  return webHttp.patch<TsItemResponse<User>>(`/users/${uid}`, data as Record<string, unknown>);
}

export function uploadAvatar(uid: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<{ avatar: string; path: string }>(
    `/ts-api/users/${uid}/avatar`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
}