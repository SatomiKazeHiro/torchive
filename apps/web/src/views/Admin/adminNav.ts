import { BiCategory, BiCollection, BiGridAlt, BiLayer } from "react-icons/bi";
import type { IconType } from "react-icons";

export interface AdminNavItem {
  path: string;
  name: string;
  icon: IconType;
  /** true = 仅在路径完全匹配时高亮（用于无子路由的页面，如仪表板）。 */
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { path: "/admin/dashboard", name: "仪表板", icon: BiGridAlt, exact: true },
  { path: "/admin/domain", name: "主题管理", icon: BiLayer },
  { path: "/admin/category", name: "分类管理", icon: BiCategory },
  { path: "/admin/media", name: "媒体管理", icon: BiCollection },
];
