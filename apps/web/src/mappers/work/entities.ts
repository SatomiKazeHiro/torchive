import type { EntitiesJson } from "@/types/db-instance";
import { naturalCompare } from "@/utils/sort";
import { RESOURCE_PATH } from "./constants";

// 解析 entities_json
export function parseEntitiesJson(jsonStr?: string): EntitiesJson {
  if (!jsonStr) return { assets: [], section: [], orphanAssets: [] };
  try {
    return JSON.parse(jsonStr) as EntitiesJson;
  } catch {
    return { assets: [], section: [], orphanAssets: [] };
  }
}

// 转换出 entities_json 正确的链接
export function transformEntities(workItem: Work): EntitiesJson {
  const { domain, category, work, detail } = workItem;
  const entitiesJson = parseEntitiesJson(detail?.entities_json);

  const categoryPath = `${RESOURCE_PATH}/${domain}/${category}`;
  const basePath = `${categoryPath}/${work}`;

  const result: EntitiesJson = {
    assets: [],
    section: [],
    orphanAssets: [],
  };
  // 处理正文
  if (entitiesJson.assets.length) {
    const links = entitiesJson.assets.map((fileName) => `${basePath}/${fileName}`);
    result.assets.push(...links);
  }
  // 处理章节
  if (entitiesJson.section.length) {
    for (const sec of entitiesJson.section) {
      result.section.push({
        name: sec.name,
        files: sec.files.map((fileName) => `${basePath}/${sec.name}/${fileName}`),
      });
    }
    // 按章节名自然排序（如：第1话、第2话、第10话）
    result.section.sort((a, b) => naturalCompare(a.name, b.name));
  }
  // 处理其他
  if (entitiesJson.orphanAssets.length) {
    const links = entitiesJson.orphanAssets.map((fileName) => `${categoryPath}/${fileName}`);
    result.orphanAssets.push(...links);
  }
  return result;
}