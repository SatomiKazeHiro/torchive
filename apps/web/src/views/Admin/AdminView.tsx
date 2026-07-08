import { Link, Outlet, useLocation } from "react-router-dom";
import { ADMIN_NAV } from "./adminNav";

function AdminView() {
  const location = useLocation();

  return (
    <div
      id="admin-page"
      className="text-rich-black min-h-screen bg-white dark:bg-zinc-950 dark:text-zinc-100"
    >
      {/* 顶部导航栏 */}
      <header className="border-subtle-ash sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-deep-black flex items-center gap-3 text-lg font-semibold tracking-[-0.025em] dark:text-zinc-100"
            >
              <span className="bg-deep-black flex h-8 w-8 items-center justify-center rounded-[10px] text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                T
              </span>
              Torchive
            </Link>
            <span className="bg-subtle-ash hidden h-5 w-px sm:block dark:bg-zinc-700" />
            <span className="text-midtone-gray hidden text-sm font-medium sm:inline dark:text-zinc-400">
              管理后台
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-rich-black hover:bg-ghost-gray rounded-[9999px] px-3 py-2 text-sm font-medium transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              返回前台
            </Link>
            <div className="bg-ghost-gray text-deep-black flex h-8 w-8 items-center justify-center rounded-[9999px] text-sm font-semibold dark:bg-zinc-800 dark:text-zinc-100">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem-1px)]">
        {/* 侧边栏 */}
        <aside className="admin-scrollbar border-subtle-ash w-56 shrink-0 overflow-y-auto border-r bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <nav className="space-y-1 p-3">
            {ADMIN_NAV.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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
