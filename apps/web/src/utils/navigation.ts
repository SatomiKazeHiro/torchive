/**
 * 作品详情页导航工具
 *
 * 提供统一的跳转方法，用于跳转到作品详情页面
 * 路径格式: /:domain/:category/:id
 */

import { NavigateFunction } from "react-router-dom";

export interface WorkNavigationParams {
  /** 作品所属领域/主题，如 anime、drama 等 */
  domain: string;
  /** 作品分类，如 series、movie 等 */
  category: string;
  /** 作品唯一标识 hash_id */
  hashId: string;
}

/**
 * 生成作品详情页的 URL 路径
 * @param params - 导航参数
 * @returns 完整的路径字符串
 */
export function generateWorkDetailPath(params: WorkNavigationParams): string {
  const { domain, category, hashId } = params;
  return `/${domain}/${category}/${hashId}`;
}

/**
 * 使用 navigate 函数跳转到作品详情页
 * @param navigate - react-router-dom 的 navigate 函数
 * @param params - 导航参数
 * @param options - 可选的导航配置
 */
export function navigateToWorkDetail(
  navigate: NavigateFunction,
  params: WorkNavigationParams,
  options?: { replace?: boolean; state?: unknown }
): void {
  const path = generateWorkDetailPath(params);
  navigate(path, options);
}

/**
 * 从 Work 对象中提取导航参数
 * @param work - Work 类型对象
 * @returns 导航参数对象
 */
export function extractWorkNavigationParams(work: Work): WorkNavigationParams {
  return {
    domain: work.domain,
    category: work.category,
    hashId: work.hash_id,
  };
}

/**
 * 便捷的跳转方法 - 直接使用 Work 对象跳转
 * @param navigate - react-router-dom 的 navigate 函数
 * @param work - Work 类型对象
 * @param options - 可选的导航配置
 */
export function navigateToWorkDetailByWork(
  navigate: NavigateFunction,
  work: Work,
  options?: { replace?: boolean; state?: unknown }
): void {
  const params = extractWorkNavigationParams(work);
  navigateToWorkDetail(navigate, params, options);
}
