import { Navigate, useLocation } from "react-router-dom";

/**
 * 旧 /index/* 路由的重定向组件。
 *
 * 背景：路由从 /index/:domain/:category/... 重构为 /:domain/:category/...，
 * 旧链接（含用户收藏、分享 URL）需要 301-style 跳转而非 404。
 *
 * - /index                    → /
 * - /index?domain=X           → /X
 * - /index?domain=X&category=Y → /X/Y
 * - /index/X/Y/Z              → /X/Y/Z
 * - /index/X/Y/Z/play         → /X/Y/Z/play
 */
export default function IndexRedirect() {
  const { pathname, search } = useLocation();
  const stripped = pathname.replace(/^\/index\/?/, "") || "";

  // 路径段优先;老链接可能是 /index?domain=X[&category=Y] 形式,翻译成 path
  if (stripped) {
    return <Navigate to={`/${stripped}${search}`} replace />;
  }

  const params = new URLSearchParams(search);
  const domain = params.get("domain");
  const category = params.get("category");

  let target: string;
  if (domain && category) {
    target = `/${domain}/${category}`;
  } else if (domain) {
    target = `/${domain}`;
  } else {
    target = "/";
  }
  return <Navigate to={target} replace />;
}
