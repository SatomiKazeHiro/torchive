import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/contexts/UserContext";

// Web 布局
import WebView from "@/views/Web/WebView";
import HomeView from "@/views/Web/Home/HomeView";
import DomainOverviewView from "@/views/Web/Domain/DomainOverviewView";
// DomainView 和 CategoryView 已合并到 DomainOverviewView，通过 query params 控制筛选
import WorkDetailView from "@/views/Web/WorkDetail/DetailView";
import WorkPlayView from "@/views/Web/WorkPlay/PlayView";

// User 布局
import UserView from "@/views/User/UserView";
import LibraryView from "@/views/User/Library/LibraryView";
import WatchLaterView from "@/views/User/WatchLater/WatchLaterView";
import HistoryView from "@/views/User/history/HistoryView";
import SettingsView from "@/views/User/Settings/SettingsView";

// Admin 布局
import AdminView from "@/views/Admin/AdminView";
import AdminDashboardView from "@/views/Admin/Dashboard/DashboardView";
import AdminMediaView from "@/views/Admin/Media/MediaView";
import AdminDomainView from "@/views/Admin/Domain/DomainView";
import AdminCategoryView from "@/views/Admin/Category/CategoryView";

// 404
import NotFound from "@/views/Others/NotFound";

// 组件展示
import ComponentsDemo from "@/views/Others/ComponentsDemo";

// 旧 /index/* 路由重定向（保留向后兼容）
import IndexRedirect from "@/views/Web/utils/IndexRedirect";

function App() {
  return (
    <UserProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#0a0a0a",
            border: "1px solid #e5e5e5",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
          },
          success: {
            iconTheme: {
              primary: "#10c22b",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#c22b10",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        {/* Web 路由组 */}
        <Route path="/" element={<WebView />}>
          {/* 首页 */}
          <Route index element={<HomeView />} />

          {/* Domain-as-top-level 路由：/:domain 是主题总览，可选 :category 进一步过滤 */}
          <Route path=":domain/:category/:id/play" element={<WorkPlayView />} />
          <Route path=":domain/:category/:id" element={<WorkDetailView />} />
          <Route path=":domain/:category" element={<DomainOverviewView />} />
          <Route path=":domain" element={<DomainOverviewView />} />
        </Route>

        {/* User 路由组 */}
        <Route path="/user/:userId" element={<UserView />}>
          <Route path="library" element={<LibraryView />} />
          <Route path="watch-later" element={<WatchLaterView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>

        {/* Admin 路由组 */}
        <Route path="/admin" element={<AdminView />}>
          <Route index element={<AdminDashboardView />} />
          <Route path="dashboard" element={<AdminDashboardView />} />
          <Route path="media" element={<AdminMediaView />} />
          <Route path="domain" element={<AdminDomainView />} />
          <Route path="category" element={<AdminCategoryView />} />
        </Route>

        {/* 组件展示页面 */}
        <Route path="/components" element={<ComponentsDemo />} />

        {/* 旧 /index/* 路由重定向（兼容老链接） */}
        <Route path="/index/*" element={<IndexRedirect />} />

        {/* 404 页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
