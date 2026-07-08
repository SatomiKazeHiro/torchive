import { Outlet, Link, useLocation } from "react-router-dom";
import NavBar from "@/features/navigation/NavBar";

function WebView() {
  const location = useLocation();

  const handleSearch = (query: string) => {
    console.log("搜索内容：", query);
  };

  // 判断是否在播放页面（播放页面使用不同的布局）
  const isPlayPage = location.pathname.includes("/play");

  if (isPlayPage) {
    return <Outlet />;
  }

  return (
    <div id="web-page">
      <div className="min-h-screen bg-page">
        <NavBar
          logo={<Link to="/" className="text-deep-black font-bold text-xl">Torchive</Link>}
          leftLinks={[
            { name: "首页", to: "/" },
          ]}
          onSearch={handleSearch}
        />
        <Outlet />
      </div>
    </div>
  );
}

export default WebView;
