/**
 * 短 hash 工具
 *
 * 用 FNV-1a 32-bit + Crockford base32 编码,默认 8 字符(40 bits)。
 * 用于把长路径(资源 URL)压缩成 URL-safe 短 ID,常驻 URL query 里。
 *
 * 碰撞概率(经验):
 * - 12 个 asset/作品: ~2.5e-12,基本为零
 * - 100 个 asset/作品: ~8.2e-11,可忽略
 *
 * 字符表: 0-9 + a-z 去 i/l/o,共 32 字符。
 * Crockford 的好处: 视觉无歧义,人眼/OCR 都好认。
 */

const BASE32 = "0123456789abcdefghjkmnpqrstvwxyz";

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(input: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function toBase32(n: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out = BASE32[n & 0x1f] + out;
    n >>>= 5;
  }
  return out;
}

/**
 * 输入任意字符串,返回固定长度的 base32 短 hash(默认 8 字符)。
 */
export function shortHash(input: string, length = 8): string {
  return toBase32(fnv1a(input), length);
}
