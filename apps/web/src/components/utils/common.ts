import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

// tailwind css 样式合并
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
