import { Link, Outlet, useLocation } from "react-router-dom";
import { BiGridAlt, BiLayer, BiCategory, BiCollection } from "react-icons/bi";

const ADMIN_NAV = [
  {
    path: "/admin/dashboard",
    name: "仪表板",
    icon: BiGridAlt,
  },
  {
    path: "/admin/domain",
    name: "主题管理",
    icon: BiLayer,
  },
  {
    path: "/admin/category",
    name: "分类管理",
    icon: BiCategory,
  },
  {
    path: "/admin/media",
    name: "媒体管理",
    icon: BiCollection,
  },
];

function AdminView() {
  const location = useLocation();

  return (
    <div
      id="admin-page"
      className="min-h-screen bg-white text-rich-black dark:bg-zinc-950 dark:text-zinc-100"
    >
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b border-subtle-ash bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 text-lg font-semibold tracking-[-0.025em] text-deep-black dark:text-zinc-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-deep-black text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                T
              </span>
              Torchive
            </Link>
            <span className="hidden h-5 w-px bg-subtle-ash sm:block dark:bg-zinc-700" />
            <span className="hidden text-sm font-medium text-midtone-gray sm:inline dark:text-zinc-400">
              管理后台
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-[9999px] px-3 py-2 text-sm font-medium text-rich-black transition-colors hover:bg-ghost-gray dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              返回前台
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-[9999px] bg-ghost-gray text-sm font-semibold text-deep-black dark:bg-zinc-800 dark:text-zinc-100">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem-1px)]">
        {/* 侧边栏 */}
        <aside className="admin-scrollbar w-56 shrink-0 overflow-y-auto border-r border-subtle-ash bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <nav className="space-y-1 p-3">
            {ADMIN_NAV.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-deep-black text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-midtone-gray hover:bg-ghost-gray hover:text-deep-black dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-white dark:text-zinc-900"
                        : "text-midtone-gray dark:text-zinc-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="admin-scrollbar flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          <Outlet />
        </main>
      </div>

      <style>{`
        .admin-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .admin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 3px;
        }
        .admin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #737373;
        }
        .admin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e5e5e5 transparent;
        }
      `}</style>
    </div>
  );
}

export default AdminView;
