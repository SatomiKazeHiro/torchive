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
