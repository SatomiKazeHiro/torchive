import * as fs from 'fs/promises';
import * as path from 'path';
import pLimit from 'p-limit';

export type FileType = 'image' | 'video' | 'audio' | 'ebook' | 'other';

export interface FileAsset {
  name: string;
  path: string;
  ext: string;
  type: FileType;
  size: number;
}

const ACCEPT_EXT: Record<FileType, Set<string>> = {
  image: new Set([
    '.apng',
    '.avif',
    '.gif',
    '.jpg',
    '.jpeg',
    '.png',
    '.svg',
    '.webp',
    '.bmp',
  ]),
  video: new Set(['.mp4', '.webm', '.ogg']),
  audio: new Set(['.mp3', '.aac', '.ogg']),
  ebook: new Set(['.txt', '.pdf', '.epub']),
  other: new Set(),
};

const COVER_PRIORITY = ['cover', 'poster', '封面', 'folder'];

const determineFileType = (ext: string): FileType => {
  ext = ext.toLowerCase();
  for (const [type, exts] of Object.entries(ACCEPT_EXT)) {
    if (exts.has(ext)) return type as FileType;
  }
  return 'other';
};

const extractCover = (files: FileAsset[]): FileAsset | undefined => {
  for (const keyword of COVER_PRIORITY) {
    const match = files.find(
      (f) =>
        f.name.toLowerCase().startsWith(keyword) &&
        ACCEPT_EXT.image.has(f.ext.toLowerCase()),
    );
    if (match) return match;
  }
  return files.find((f) => ACCEPT_EXT.image.has(f.ext.toLowerCase()));
};

/**
 * 扫描目录，返回资源文件和封面
 */
export async function scanDirAssets(
  dirPath: string,
  concurrencyLimit: number = 10,
): Promise<{ assets: FileAsset[]; cover?: FileAsset }> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const limit = pLimit(concurrencyLimit);

  const tasks = entries
    .filter((entry) => !entry.isDirectory())
    .map((entry) =>
      limit(async () => {
        const filePath = path.join(dirPath, entry.name);
        const ext = path.extname(entry.name).toLowerCase();
        const stat = await fs.stat(filePath);

        const asset: FileAsset = {
          name: entry.name,
          path: filePath,
          ext,
          type: determineFileType(ext),
          size: stat.size,
        };

        return asset;
      }),
    );

  const assets = await Promise.all(tasks);
  const cover = extractCover(assets);

  return { assets, cover };
}
