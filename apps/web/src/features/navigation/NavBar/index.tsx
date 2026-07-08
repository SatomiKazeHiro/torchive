import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDebounceFn } from "ahooks";
import { BiSearch, BiUser, BiLogOut, BiTime, BiBookmark, BiHeart } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { ThemeSwitcher } from "@/components";
import { getDetailsPage } from "@/api";
import type { WorkDetail } from "@/types/db-instance";
import { useUser } from "@/contexts/useUser";
import { getAvatarUrl } from "@/utils/avatar";
import { confirm } from "@/components/Modal/modal";
import AuthModal from "./AuthModal";
import "./index.less";

interface NavbarProps {
  logo?: React.ReactNode;
  leftLinks?: { name: string; to: string }[];
  rightBefore?: React.ReactNode;
  onSearch?: (query: string) => void;
  mode?: "normal" | "black-gradient" | "white-gradient";
}

/**
 * 顶部导航栏三种模式：
 * - normal：常规白底（背景由 bg-card 承载，主题感知）
 * - white-gradient：滚动前透明叠加，滚动后同 normal
 * - black-gradient：滚动前黑底白字叠加（首页 hero），滚动后实色黑底
 *   —— 该模式无论用户主题如何都呈黑色，因为背景是深色 hero 图，无需主题变体
 */
export default function Navbar({
  rightBefore,
  logo,
  leftLinks = [],
  onSearch,
  mode = "normal",
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [query, setQuery] = React.useState("");
  const [isSticky, setIsSticky] = React.useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  // 用户菜单关闭延迟：position:absolute 的下拉不参与父容器 hover 判定，
  // 鼠标从头像移动到下拉时父容器 onMouseLeave 会先触发，加延迟给鼠标"跨过去"的时间
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听滚动
  React.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 打开用户菜单：取消挂起的关闭
  const openUserMenu = () => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
    setMenuOpen(true);
  };
  // 延迟关闭用户菜单：150ms 内若鼠标进入下拉则取消
  const scheduleCloseUserMenu = () => {
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = setTimeout(() => {
      setMenuOpen(false);
      menuCloseTimerRef.current = null;
    }, 150);
  };
  // 卸载时清理定时器
  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    };
  }, []);

  const { run: debouncedSearch } = useDebounceFn(
    async (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getDetailsPage({ keyword: trimmed, limit: 8 });
        setResults(res.data || []);
        setShowResults(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    },
    { wait: 300 },
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    debouncedSearch(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    debouncedSearch(query);
  };

  const handleResultClick = (detail: WorkDetail) => {
    setShowResults(false);
    setQuery("");
    setActiveIndex(-1);
    navigate(`/${detail.domain}/${detail.category}/${detail.hash_id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev >= results.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleResultClick(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const isBlackOverlay = mode === "black-gradient" && !isSticky;

  // 背景样式
  const bgClass = React.useMemo(() => {
    if (mode === "black-gradient") {
      return isSticky ? "bg-black shadow-2xs" : "bg-gradient-to-b from-black/50 to-black/0";
    }
    if (mode === "white-gradient") {
      return isSticky ? "bg-card shadow-2xs" : "bg-gradient-to-b from-white/50 to-white/0";
    }
    // normal：始终使用 bg-card，主题感知
    return "bg-card shadow-2xs";
  }, [isSticky, mode]);

  // 链接样式：normal/white-gradient-sticky 用主题色；其他保持 hero 风格
  const linkStyle = React.useMemo(() => {
    if (mode === "black-gradient") {
      return isSticky
        ? { idle: "text-gray-200 hover:text-white", active: "text-white" }
        : { idle: "text-white hover:text-deep-black", active: "text-white" };
    }
    if (mode === "white-gradient" && !isSticky) {
      return { idle: "text-gray-200 hover:text-white", active: "text-white" };
    }
    return { idle: "text-secondary hover:text-primary", active: "text-primary" };
  }, [isSticky, mode]);

  // 判断左侧链接是否处于激活态：根路径要求完全匹配，子路径支持前缀匹配
  const isLinkActive = React.useCallback(
    (to: string) => {
      const path = location.pathname;
      if (to === "/") return path === "/";
      return path === to || path.startsWith(to + "/");
    },
    [location.pathname],
  );

  // 搜索框样式
  const inputClass = React.useMemo(() => {
    const baseLayout =
      "w-full border rounded-lg px-4 py-1 border-transparent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent focus:bg-card focus:text-primary";
    if (mode === "black-gradient") {
      return isSticky
        ? `${baseLayout} bg-gray-800 text-gray-200 placeholder-gray-500 border-gray-700`
        : `${baseLayout} bg-white/10 text-white placeholder-white/60 border-white/20 backdrop-blur-sm`;
    }
    if (mode === "white-gradient" && !isSticky) {
      return `${baseLayout} bg-black/5 text-gray-700 placeholder-gray-500 border-black/5`;
    }
    return `${baseLayout} bg-subtle text-primary placeholder-faint ring-1 ring-edge`;
  }, [isSticky, mode]);

  return (
    <nav className={`ta-nav-bar sticky top-0 z-100 w-full transition-all duration-500 ${bgClass}`}>
      <div className="relative flex h-16 items-center justify-between px-4 py-2">
        {/* 左侧：Logo + 链接 */}
        <div className="flex items-center space-x-6">
          <div
            className={cn(
              "text-xl font-bold transition-colors duration-300",
              isBlackOverlay ? "text-white" : "text-primary",
            )}
          >
            {logo}
          </div>
          <div className="hidden space-x-4 md:flex">
            {leftLinks.map((link) => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  className={cn(
                    "relative px-1 transition-colors",
                    active ? `${linkStyle.active} font-medium` : linkStyle.idle,
                  )}
                >
                  {link.name}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-current" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 中间：搜索框 */}
        <div ref={searchRef} className="absolute left-1/2 w-full max-w-md -translate-x-1/2 transform">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="搜索"
              className={`${inputClass} pr-10`}
            />
            <button
              type="submit"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
                isBlackOverlay
                  ? "text-white/60 hover:text-white"
                  : "text-faint hover:text-secondary",
              )}
            >
              <BiSearch size={18} />
            </button>
          </form>

          {/* 搜索结果下拉 */}
          {showResults && (
            <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-edge bg-card shadow-2xs">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-faint">搜索中...</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-faint">暂无匹配内容</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-2">
                  {results.map((detail, index) => (
                    <li key={detail.hash_id}>
                      <button
                        onClick={() => handleResultClick(detail)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "w-full px-4 py-2 text-left transition-colors",
                          index === activeIndex
                            ? "bg-subtle"
                            : "hover:bg-subtle/60",
                        )}
                      >
                        <p className="truncate text-sm font-medium text-primary">
                          {detail.name}
                        </p>
                        {detail.title && detail.title !== detail.name && (
                          <p className="truncate text-xs text-faint">{detail.title}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 右侧：链接 */}
        <div className="flex items-center space-x-4">
          {rightBefore}

          {/* 主题切换 */}
          <ThemeSwitcher />

          {/* 用户头像 / 登录入口 */}
          <div ref={avatarRef} className="relative">
            {user ? (
              <div
                className="relative"
                onClick={() => setMenuOpen((prev) => !prev)}
                onMouseEnter={openUserMenu}
                onMouseLeave={scheduleCloseUserMenu}
              >
                <Link
                  to={`/user/${user.uid}/library`}
                  className="group flex items-center gap-2"
                >
                  {getAvatarUrl(user.avatar) ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt="avatar"
                      className="2xs-soft h-8 w-8 rounded-full border border-edge object-cover"
                    />
                  ) : (
                    <div className="2xs-soft flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-700">
                      {user.user_name?.[0] ?? user.login_name?.[0] ?? "U"}
                    </div>
                  )}
                </Link>

                {/* 下拉菜单 */}
                {menuOpen && (
                  <div
                    className="2xs-soft absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-lg border border-edge bg-card"
                    onMouseEnter={openUserMenu}
                    onMouseLeave={scheduleCloseUserMenu}
                  >
                    <div className="border-b border-edge-subtle px-3 py-2">
                      <p className="truncate text-sm font-medium text-primary">
                        {user.user_name || user.login_name}
                      </p>
                      <p className="truncate text-xs text-muted">ID: {user.uid}</p>
                    </div>
                    <Link
                      to={`/user/${user.uid}/library`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-secondary transition-colors hover:bg-subtle"
                    >
                      <BiHeart size={16} />
                      我的收藏
                    </Link>
                    <Link
                      to={`/user/${user.uid}/history`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-secondary transition-colors hover:bg-subtle"
                    >
                      <BiTime size={16} />
                      历史记录
                    </Link>
                    <Link
                      to={`/user/${user.uid}/watch-later`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-secondary transition-colors hover:bg-subtle"
                    >
                      <BiBookmark size={16} />
                      稍后再看
                    </Link>
                    <div className="border-t border-edge-subtle" />
                    <button
                      onClick={() => {
                        confirm({
                          title: "退出登录",
                          content: "确定要退出登录吗？",
                          type: "confirm",
                          okText: "退出",
                          onOk: () => {
                            logout();
                          },
                        });
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary transition-colors hover:bg-subtle"
                    >
                      <BiLogOut size={16} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className={cn(
                  "2xs-soft flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                  isBlackOverlay
                    ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    : "border-edge bg-card text-muted hover:border-secondary hover:text-primary",
                )}
              >
                <BiUser size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
}
