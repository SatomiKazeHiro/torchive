import { createContext, useContext } from "react";

export interface UserProfile {
  uid: string;
  login_name: string;
  user_name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (loginName: string, password: string) => Promise<void>;
  register: (data: {
    login_name: string;
    password: string;
    user_name?: string;
    phone?: string;
    email?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Omit<UserProfile, "uid">>) => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}