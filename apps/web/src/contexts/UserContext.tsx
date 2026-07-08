import React, { useState, useEffect, useCallback } from "react";
import { getUser, loginUser, registerUser, updateUser } from "@/api/web";
import toast from "react-hot-toast";
import { UserContext, type UserProfile } from "./useUser";

const STORAGE_KEY = "torchive_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (uid: string) => {
    try {
      const res = await getUser(uid);
      if (res?.data) {
        setUser(res.data as UserProfile);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserProfile;
        setUser(parsed);
        loadUser(parsed.uid).finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [loadUser]);

  const login = useCallback(async (loginName: string, password: string) => {
    try {
      const res = await loginUser({ login_name: loginName, password });
      const profile = res.data as UserProfile;
      setUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      toast.success("登录成功");
    } catch (err) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      const message = errorObj?.data?.error?.message || errorObj?.message || "登录失败";
      toast.error(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (data: {
    login_name: string;
    password: string;
    user_name?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      await registerUser(data);
      toast.success("注册成功，请登录");
    } catch (err) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      const message = errorObj?.data?.error?.message || errorObj?.message || "注册失败";
      toast.error(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("已退出登录");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.uid) return;
    await loadUser(user.uid);
  }, [user?.uid, loadUser]);

  const updateProfile = useCallback(async (data: Partial<Omit<UserProfile, "uid">>) => {
    if (!user?.uid) return;
    const res = await updateUser(user.uid, data);
    const updated = { ...user, ...(res.data as UserProfile) };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success("更新成功");
  }, [user]);

  return (
    <UserContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser, updateProfile }}
    >
      {children}
    </UserContext.Provider>
  );
}