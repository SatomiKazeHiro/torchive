# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Torchive** — 媒体资源管理与播放前端（React 19 + TypeScript + Vite）。项目同时承载三类页面：

- **Web**（`src/views/Web/`）— 公开浏览：首页、`DomainOverviewView`（主题/分类总览，按 query 筛选）、`WorkDetailView`（详情）、`WorkPlayView`（播放页，按模板分发）
- **User**（`src/views/User/`）— 已登录用户空间：`/user/:userId` 下挂 `library` / `watch-later` / `history` / `settings`
- **Admin**（`src/views/Admin/`）— 管理后台：`/admin` 下挂 `dashboard` / `domain` / `category` / `media`

后端 API 通过 Vite 代理转发 `/ts-api → http://localhost:2333`，网易云 API 走 `/api-netease → https://music.163.com`。

## Commands

使用 **pnpm**（项目含 `pnpm-workspace.yaml`）。

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器 (vite)
pnpm build            # tsc -b && vite build（先做类型检查再打包）
pnpm lint             # eslint .（eslint.config.js 平面配置，扁平 ts/tsx）
pnpm preview          # vite preview（预览生产产物）
```

无单元测试框架（package.json 中无 test 脚本）—— 通过 `pnpm build` 间接做类型检查即可验证代码正确性。修改组件后务必运行 `pnpm lint && pnpm build`。

## Code Architecture

### 路由与三套布局

`src/main.tsx` 注入 `BrowserRouter` + `ScrollToTop`。`src/App.tsx` 在 `UserProvider`（`src/contexts/UserContext.tsx`）下声明三组嵌套路由：

- `/` → `WebView`（顶部 `NavBar` + `<Outlet/>`，检测到 `/play` 子路由时切换为全屏布局）
- `/user/:userId/*` → `UserView`（用户主页壳，鉴权失败跳回首页）
- `/admin/*` → `AdminView`（侧边栏 + 顶栏的经典后台壳）

子路由命名与文件保持一致（如 `Admin/Media/MediaView.tsx` 对应 `/admin/media`）。

### API 层：`src/api/`

- `request.ts` — 基于 axios 的 `createInstance(config)` 工厂，自带响应拦截器把 axios 错误归一化为 `CustomError<BackendErrorResponse>`。HTTP 方法重载支持 `returnAll` 选项（默认只返回 `res.data`，置 `true` 则返回 `{ data, status, headers, config }`）。`del` 别名映射 axios 的 `delete`。
- `web.ts` — 唯一的 API 聚合文件，所有 `/ts-api/*` 调用集中在此，按域分组（works / domains / categories / details / users / user-favorites / user-histories / user-watch-laters）。所有 `get*Page` 系列约定返回 `TsResponse<T> = { data: T[]; meta: { limit, page, total, totalPages?, random? } }`。

新增接口时请在 `web.ts` 添加并遵循现有命名约定（POST 列表用 `/page`，单条 GET/PATCH/DELETE 用 `/<id>`）。

### 全局类型：`src/types/`

- `db-instance.ts` — 实体接口：`Domain`、`Category`、`Work`（含嵌套 `WorkDetail`）、`User`、`UserFavorite`、`UserHistory`、`UserWatchLater`。
- `global.d.ts` — 通过 `declare global` 把上述类型提升为全局（`type Domain = ...`），因此业务代码中可直接使用无导入。`WorkPageTemplate = "mixture" | "video" | "manga" | "album" | "music" | "ebook"` 决定了 `PlayView` 的模板分发。
- `enum.ts` — 模板字面量联合。

### Mappers：`src/mappers/`

把后端实体转成视图/资源 URL。`work.ts` 关键函数：

- `generateCoverUrl(workItem)` — 拼接 `/ts-api/resources/{domain}/{category}/{work?}/{cover}`，根据 `is_orphan` 决定是否带 work 子目录。
- `mapWorkToBrief(work)` — 转 `{ label, cover, link, description }`，`link` 形如 `/{domain}/{category}/{hash_id}`。
- `parseEntitiesJson` / `transformEntities` — 解析 `detail.entities_json`（含 `assets` / `section` / `orphanAssets`），驱动播放页内容渲染。

### 组件库：`src/components/`

自研 UI 库，统一通过 `src/components/index.ts` 导出。所有组件遵循 `docs/DESIGN.md` 中定义的设计令牌（极简黑白色调、`#e5e5e5` 边框、`#0a0a0a` 文本、`#000000` CTA、`#737373` 次级文本；圆角 `10/14/26/9999`）。常见组件：`Button`、`Input`、`Switch`、`Slider`、`Radio`、`Checkbox`、`Form`、`Card`、`Tabs`、`Tree`、`Drawer`、`List`、`Table`、`Modal`（带 `confirm/info/success/warning/error` 命令式 API）、`Select`、`Skeleton`、`Pagination`、`Poster`/`PosterV2`、`Tooltip`、`Empty`、`Breadcrumb`、`Carousel`。

`src/components/utils/common.ts` 提供 `cn(...)`（基于 `clsx` + `tailwind-merge`）用于条件类名合并。新页面样式请复用这里。

### Features：`src/features/`

可复用业务功能块，与纯 UI 组件区分：

- `common/` — 横版播放器相关：`CinematicCarousel`、`HorizontalScroller`、`InPlaying`，以及阅读器：`MobileTxtReader`、`PdfReader`、`TxtReader`（分别封装 `epubjs` / `pdfjs-dist` / `music-metadata`）。
- `navigation/NavBar` — Web 前台的统一顶部导航。
- `user-library/` — `FavoriteAction`、`WatchLaterAction`（带后端写操作）。

### 播放页模板分发（重要模式）

`src/views/Web/WorkPlay/PlayView.tsx` 根据后端 `category.work_page_template` 字段动态选用 `templates/{Mixture|Video|Manga|Music|Album|Ebook}/`。修改播放行为时请定位到对应模板，而非 `PlayView.tsx`。

### 用户上下文

`src/contexts/UserContext.tsx` — `UserProvider` 包裹整个 App。`localStorage["torchive_user"]` 持久化登录态；登录成功后存入会自动调用 `loadUser` 后台刷新。toast 反馈用 `react-hot-toast`（已在 `App.tsx` 中配置 `<Toaster position="top-center">`，组件内调用 `toast.success/error(...)`）。

### 别名与样式

- `@/` → `src/`（在 `tsconfig.json` 与 `vite.config.ts` 中均配置）。
- Tailwind CSS v4（`@tailwindcss/vite`），全局入口 `src/index.css` 通过 `@import "tailwindcss"; @config "../tailwind.config.js"` 引入。`tailwind.config.js` 已注册 `shimmer` / `spin-slow` / `music-bar` 动画与 `2xs-soft` 阴影。字体：项目全局使用 `HarmonyOS Sans SC`，后台页 (`AdminView`) 内联覆盖为 Geist 栈。
- 默认语言：中文。提交信息使用 emoji 前缀：`✨ feat` / `🎈 perf` / `🐛 fix` 等。

## Conventions

- 优先使用 **Edit** 修改现有文件，避免新建无关文档。
- 不要新增 CLAUDE.md / README 之外的说明文档。
- 修改跨模块代码（API + 类型 + Mapper + 页面）时按依赖顺序：先 `db-instance.ts` → `web.ts` → mapper → 组件。
- 设计系统严格遵循 `docs/DESIGN.md`：避免饱和色、装饰性阴影、装饰性渐变；按钮/标签圆角优先 `9999px`/`26px`，输入框/卡片 `10px`/`14px`。
- 修改完成后运行 `pnpm lint && pnpm build` 验证。