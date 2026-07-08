/**
 * 自然排序比较函数
 * 处理字符串中的数字部分按数值排序，而非字典序
 * 
 * 例如: ["1.jpg", "2.jpg", "11.jpg", "22.jpg"] 
 * 字符串排序: ["1.jpg", "11.jpg", "2.jpg", "22.jpg"] ❌
 * 自然排序: ["1.jpg", "2.jpg", "11.jpg", "22.jpg"] ✅
 */
export function naturalCompare(a: string, b: string): number {
  // 提取字符串中的数字和非数字部分
  const regex = /(\d+|\D+)/g;
  const partsA = a.match(regex) || [];
  const partsB = b.match(regex) || [];

  const minLen = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < minLen; i++) {
    const partA = partsA[i];
    const partB = partsB[i];

    // 判断当前部分是否为数字
    const isNumA = /^\d+$/.test(partA);
    const isNumB = /^\d+$/.test(partB);

    if (isNumA && isNumB) {
      // 都是数字，按数值比较
      const numA = parseInt(partA, 10);
      const numB = parseInt(partB, 10);
      if (numA !== numB) {
        return numA - numB;
      }
    } else {
      // 按字符串比较
      const cmp = partA.localeCompare(partB);
      if (cmp !== 0) {
        return cmp;
      }
    }
  }

  // 如果前面都相同，比较长度
  return partsA.length - partsB.length;
}

/**
 * 文件名排序（自然排序）
 * @param files 文件路径或文件名数组
 * @returns 排序后的数组（新数组，不修改原数组）
 * 
 * 示例:
 * sortFileNames(["11.jpg", "1.jpg", "2.jpg", "22.jpg"])
 * // => ["1.jpg", "2.jpg", "11.jpg", "22.jpg"]
 * 
 * sortFileNames(["第10集.mp4", "第1集.mp4", "第2集.mp4"])
 * // => ["第1集.mp4", "第2集.mp4", "第10集.mp4"]
 */
export function sortFileNames(files: string[]): string[] {
  return [...files].sort(naturalCompare);
}

/**
 * 按文件名的数字前缀排序
 * 适用于类似 "01.jpg", "02.jpg" 这样的命名
 * @param files 文件路径或文件名数组
 * @returns 排序后的数组
 * 
 * 示例:
 * sortByNumericPrefix(["img_10.png", "img_1.png", "img_2.png"])
 * // => ["img_1.png", "img_2.png", "img_10.png"]
 */
export function sortByNumericPrefix(files: string[]): string[] {
  return [...files].sort((a, b) => {
    // 提取开头的数字
    const numA = parseInt(a.match(/^\d+/)?.[0] || "0", 10);
    const numB = parseInt(b.match(/^\d+/)?.[0] || "0", 10);
    
    if (numA !== numB) {
      return numA - numB;
    }
    
    // 数字相同，使用自然排序
    return naturalCompare(a, b);
  });
}

/**
 * 通用文件列表排序器
 * 智能检测文件名特征，选择最佳排序策略
 */
export function sortFiles(files: string[]): string[] {
  if (files.length === 0) return [];

  // 检测是否所有文件名都以数字开头
  const allStartWithNumber = files.every((f) => /^\d/.test(f));
  
  if (allStartWithNumber) {
    // 如果都有数字前缀，优先使用数字前缀排序
    return sortByNumericPrefix(files);
  }

  // 默认使用自然排序
  return sortFileNames(files);
}

/**
 * 章节/剧集排序专用
 * 处理常见的剧集命名格式
 * 
 * 支持的格式:
 * - 第1集.mp4, 第2集.mp4, 第10集.mp4
 * - EP01.mp4, EP02.mp4, EP10.mp4
 * - 1-1.mp4, 1-2.mp4, 1-10.mp4
 * - S01E01.mp4, S01E02.mp4
 */
export function sortEpisodes(files: string[]): string[] {
  return [...files].sort((a, b) => {
    // 提取所有数字序列
    const numsA = a.match(/\d+/g)?.map(Number) || [];
    const numsB = b.match(/\d+/g)?.map(Number) || [];

    // 逐位比较数字
    const minLen = Math.min(numsA.length, numsB.length);
    for (let i = 0; i < minLen; i++) {
      if (numsA[i] !== numsB[i]) {
        return numsA[i] - numsB[i];
      }
    }

    // 数字部分相同，比较长度（短的在前）
    if (numsA.length !== numsB.length) {
      return numsA.length - numsB.length;
    }

    // 最后使用自然排序兜底
    return naturalCompare(a, b);
  });
}
