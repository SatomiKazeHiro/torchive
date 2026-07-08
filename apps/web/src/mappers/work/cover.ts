import { RESOURCE_PATH } from "./constants";

/**
 * 生成作品封面 URL
 * @param workItem - 作品数据
 * @param options - 配置选项
 * @returns 封面图片的完整 URL，如果没有封面则返回空字符串或默认封面
 */
export function generateCoverUrl(
  workItem: Work,
  options: { defaultCover?: string } = {},
): string {
  const { domain, category, work, detail } = workItem;

  if (!detail?.cover) {
    return options.defaultCover || "";
  }

  const basePath = `${RESOURCE_PATH}/${domain}/${category}`;

  // is_orphan=1 时封面直接在分类目录下，否则在作品子目录下
  return detail.is_orphan ? `${basePath}/${detail.cover}` : `${basePath}/${work}/${detail.cover}`;
}