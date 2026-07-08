import { BiHome } from "react-icons/bi";
import type { BreadcrumbItem } from "@/components/Breadcrumb";

export interface BreadcrumbRouteConfig {
  /** 主题代码 */
  domain: string;
  /** 分类代码 */
  category: string;
  /** 主题显示名称 */
  domainName?: string;
  /** 作品名（作为最后的不可点击项） */
  workName?: string;
  /** 是否显示「首页」项 */
  showHome?: boolean;
  /** 「总览」项的显示文案，默认"内容总览" */
  overviewLabel?: string;
}

/**
 * 组装作品详情/播放页的标准面包屑路径。
 *
 * 默认路径：内容总览 / 主题 / 分类 / [作品名]
 * 开启 showHome 后：首页 / 内容总览 / 主题 / 分类 / [作品名]
 *
 * @example
 * buildBreadcrumbItems({ domain: "anime", category: "series", domainName: "动画", showHome: true })
 * // => [
 * //   { label: "首页", to: "/", icon: <BiHome /> },
 * //   { label: "内容总览", to: "/" },
 * //   { label: "动画", to: "/anime" },
 * //   { label: "series", to: "/anime/series" },
 * // ]
 */
export function buildBreadcrumbItems(
  config: BreadcrumbRouteConfig,
): BreadcrumbItem[] {
  const {
    domain,
    category,
    domainName,
    workName,
    showHome = false,
    overviewLabel = "内容总览",
  } = config;
  const items: BreadcrumbItem[] = [];

  if (showHome) {
    items.push({
      label: "首页",
      to: "/",
      icon: <BiHome className="h-3 w-3" />,
    });
  }

  items.push({ label: overviewLabel, to: "/" });

  if (domain) {
    items.push({
      label: domainName || domain,
      to: `/${domain}`,
    });
  }

  if (category) {
    items.push({
      label: category,
      to: `/${domain}/${category}`,
    });
  }

  if (workName) {
    items.push({ label: workName });
  }

  return items;
}
