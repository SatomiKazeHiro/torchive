/**
 * 头像 URL 解析工具
 * avatar 字段格式：
 * - file:uploads/avatar.{uid}.ext  → 本地上传文件
 * - net:https://example.com/avatar.jpg → 网络图片
 * - 其他 → 原样返回（兼容旧数据）
 *
 * 缓存策略：上传成功后后端会返回新的 avatar 字符串（含新路径/版本号），
 * URL 字符串变化即触发浏览器重新请求，无需在客户端拼随机数后缀。
 * 之前在渲染路径上生成 ?s=Math.random() 会导致每次 render 都更换 URL，
 * 触发 <img> 反复请求并打挂 PosterV2 的 IntersectionObserver。
 */

export function getAvatarUrl(avatar?: string): string | undefined {
  if (!avatar) return undefined;
  if (avatar.startsWith("file:")) {
    return "/ts-api/" + avatar.slice(5); // /ts-api/uploads/avatar.xxx.ext
  }
  if (avatar.startsWith("net:")) {
    return avatar.slice(4);
  }
  return avatar;
}
