/**
 * 生成高质量的 53 位哈希值。
 * 支持 UTF-8 字符串（emoji、多语言字符）；
 * 可选输出为 BigInt，避免精度损失。
 *
 * @param str   要哈希的字符串
 * @param seed  可选种子值（默认 1）
 * @param useBigInt 是否返回 BigInt 类型（默认 false）
 */
export function cyrb53(
  str: string,
  seed: number = 1,
  useBigInt: boolean = false,
): number | bigint {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  const bytes = new TextEncoder().encode(str); // UTF-8 编码支持 emoji 等字符
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes[i];
    h1 = Math.imul(h1 ^ ch, 0x85ebca6b); // 2654435761
    h2 = Math.imul(h2 ^ ch, 0xc2b2ae35); // 1597334677
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);

  const resultHigh = h2 & 0x1fffff; // 21 bits
  const resultLow = h1 >>> 0; // 强制无符号

  return useBigInt
    ? (BigInt(resultHigh) << 32n) + BigInt(resultLow)
    : 4294967296 * resultHigh + resultLow;
}
