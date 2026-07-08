import { sortFiles } from "@/utils/sort";
import { filterImageFiles } from "@/utils/fileHelper";
import type { ChapterUnit } from "./types";
import type { EntitiesJson } from "@/types/db-instance";

// 生成章节单元列表
export function generateChapterUnits(entities: EntitiesJson): ChapterUnit[] {
  const units: ChapterUnit[] = [];

  // assets → 本篇
  const imageAssets = filterImageFiles(entities.assets);
  if (imageAssets.length > 0) {
    const sorted = sortFiles(imageAssets);
    units.push({
      key: "unit_assets",
      name: "本篇",
      files: sorted,
      cover: sorted[0],
    });
  }

  // section → 各话/节
  if (entities.section && entities.section.length > 0) {
    entities.section.forEach((sec, index) => {
      const imageFiles = filterImageFiles(sec.files);
      if (imageFiles.length > 0) {
        const sorted = sortFiles(imageFiles);
        units.push({
          key: `unit_section_${index}`,
          name: sec.name,
          files: sorted,
          cover: sorted[0],
        });
      }
    });
  }

  // orphanAssets → 其他
  const imageOrphans = filterImageFiles(entities.orphanAssets);
  if (imageOrphans.length > 0) {
    const sorted = sortFiles(imageOrphans);
    units.push({
      key: "unit_orphan",
      name: "其他",
      files: sorted,
      cover: sorted[0] || null,
    });
  }

  return units;
}

// 从 URL state 解析初始文件路径(已废弃:PlayView 直接把解析后的完整路径作为 initialFilePath 传入)
// 保留是为了不破坏潜在外部引用;新代码请勿使用。
/** @deprecated */
export function parseInitialFilePath(locationState: unknown): string | undefined {
  return (locationState as { filePath?: string })?.filePath;
}

// 查找文件所在章节索引
export function findChapterIndexByFile(units: ChapterUnit[], filePath: string): number {
  let chapterIndex = 0;
  units.forEach((unit, index) => {
    if (unit.files.some((f) => f === filePath || f.includes(filePath))) {
      chapterIndex = index;
    }
  });
  return chapterIndex;
}

// 在章节中查找页码
export function findPageIndexInChapter(chapter: ChapterUnit, filePath: string): number {
  const pageIndex = chapter.files.findIndex((f) => f === filePath || f.includes(filePath));
  return pageIndex >= 0 ? pageIndex + 1 : 1;
}
