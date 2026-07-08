import { Outlet, Link, useParams, useLocation, Navigate } from "react-router-dom";
import { BiHeart, BiTime, BiBookmark, BiCog } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import { getAvatarUrl } from "@/utils/avatar";
import { cn } from "@/components/utils/common";

const sizeClasses = {
  lg: "w-16 h-16 text-xl",
  xl: "w-28 h-28 sm:w-36 sm:h-36 text-3xl",
};

const nameHeightClasses = {
  lg: "h-16",
  xl: "h-28 sm:h-36",
};

const boxTransformYClasses = {
  lg: "-mt-8",
  xl: "",
};

/**
 * 头像：图片用 card 背景 + 卡片底色描边（与下层用户信息区融为一体）；
 * 字母占位保持深色填充，避免与卡片融为一体。
 */
function UserAvatar({
  user,
  size = "lg",
  className,
}: {
  user: { avatar?: string; user_name?: string; login_name?: string };
  size?: "lg" | "xl";
  className?: string;
}) {
  const url = getAvatarUrl(user.avatar);
  const initial = (user.user_name || user.login_name || "?")[0];
  const cls = sizeClasses[size];

  if (url) {
    return (
      <img
        src={url}
        alt="avatar"
        className={cn(
          `${cls} 2xs-soft border-card bg-card rounded-full border-4 object-cover`,
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        `${cls} 2xs-soft border-card flex items-center justify-center rounded-full border-4 bg-zinc-900 font-bold text-white dark:bg-zinc-700`,
        className,
      )}
    >
      {initial}
    </div>
  );
}

const USER_NAV = [
  { path: "library", name: "我的收藏", icon: BiHeart },
  { path: "watch-later", name: "稍后再看", icon: BiBookmark },
  { path: "history", name: "观看历史", icon: BiTime },
  { path: "settings", name: "个人设置", icon: BiCog },
];

function UserView() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const displayName = user.user_name || user.login_name || "用户";

  return (
    <div id="user-page" className="bg-page min-h-screen font-sans">
      {/* 顶部导航栏 - 返回首页等极简操作 */}
      <header className="border-edge-subtle bg-card/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-primary hover:text-secondary flex items-center gap-2 transition-colors"
              >
                <span className="text-lg font-bold tracking-tight">Torchive</span>
              </Link>
            </div>
            {/* 你可以在这里添加右上角的其他入口，例如返回首页等 */}
          </div>
        </div>
      </header>

      {/* 页面主体内容区 */}
      <div className="pt-14">
        {/* 用户信息区和导航 */}
        <div className="2xs-soft border-edge-subtle bg-card mb-6 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative pt-0 pb-0">
              <div className="flex flex-col justify-between sm:flex-row sm:items-end">
                {/* 头像与用户信息 */}
                <div
                  className={`relative z-10 flex items-end gap-4 pb-4 sm:gap-6 ${boxTransformYClasses["xl"]}`}
                >
                  <UserAvatar user={user} size="xl" className="shadow-2xs" />

                  <div className={nameHeightClasses["xl"]}>
                    {/* 用户名称/UID */}
                    <div className="flex h-1/2 flex-col justify-center">
                      <h1 className="text-primary line-clamp-1 text-xl font-bold tracking-tight sm:text-2xl">
                        {displayName}
                      </h1>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-muted text-xs sm:text-sm">UID: {userId}</p>
                      </div>
                    </div>
                    {/* 用户签名/简介 */}
                    <div className="text-secondary mt-4 line-clamp-2 text-xs sm:text-sm">
                      <p>这是你的个人主页，在这里管理收藏、历史记录以及稍后再看。</p>
                    </div>
                    {/* 数据统计 */}
                    <div className="text-muted mt-2 flex items-center gap-4 text-xs whitespace-nowrap sm:text-sm">
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary font-semibold">0</span>
                        <span>关注</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary font-semibold">0</span>
                        <span>粉丝</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 编辑资料按钮 - 靠右对齐 */}
                <div className="hidden pb-4 sm:block">
                  {/* <Link
                    to={`/user/${userId}/settings`}
                    className="px-4 py-1.5 rounded border border-edge bg-card text-sm font-medium text-secondary hover:bg-subtle hover:text-primary transition-colors"
                  >
                    编辑个人资料
                  </Link> */}
                </div>
              </div>

              {/* 导航 Tabs (内嵌在用户信息区底部) */}
              <div className="mt-2">
                <nav className="no-scrollbar flex space-x-2 overflow-x-auto sm:space-x-8">
                  {USER_NAV.map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={`/user/${userId}/${item.path}`}
                        className={cn(
                          "relative flex items-center gap-1.5 px-2 py-3 text-[15px] font-medium whitespace-nowrap transition-colors sm:px-3 sm:py-4",
                          isActive ? "text-primary font-bold" : "text-muted hover:text-secondary",
                        )}
                      >
                        <item.icon size={18} className={isActive ? "text-primary" : "text-faint"} />
                        {item.name}
                        {isActive && (
                          <span className="bg-accent absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full"></span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserView;
