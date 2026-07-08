# CLAUDE.md

## Project Overview

**Torchive** — 媒体资源管理与播放平台，pnpm-workspace 单仓多包结构。

- **`apps/web/`** — React 19 + Vite + Tailwind v4 前端（`@torchive/web`）。`src/views/{Web,User,Admin}/` 三大区。
- **`apps/api/`** — NestJS 11 + TypeORM + better-sqlite3 后端（`@torchive/api`）。Nest 经典 `*/{module,controller,service,entities,dto}/` 布局。
- **`packages/shared/`** — 前后端共享的纯 TS 类型（`@torchive/shared`）。当前仅前端消费；后端实体类暂未对齐。

后端通过 Vite 代理转发 `/ts-api → http://localhost:2333`，网易云走 `/api-netease → https://music.163.com`。

## Commands

使用 **pnpm**（必须 ≥ 9）。根目录执行会作用于整个 workspace。

```bash
pnpm install              # 安装所有 workspace 依赖（含 better-sqlite3 原生构建）
pnpm dev                  # 同时启动前后端（concurrently）
pnpm dev:web              # 仅前端（:5173）
pnpm dev:api              # 仅后端（:2333）
pnpm build                # 构建所有 app
pnpm build:web / build:api
pnpm lint                 # 全量 lint
pnpm typecheck            # 前端 + 共享包类型检查（后端走 nest build 隐式）
pnpm clean                # 清空所有 dist
```

无单元测试框架（package.json 中无 test 脚本）—— 通过 `pnpm build` 间接做类型检查。修改后务必跑 `pnpm lint && pnpm build`。

## Code Architecture

### 共享类型：`packages/shared/`

所有跨前后端的纯 TS 类型在 `packages/shared/src/`：

- `db-instance.ts` — 实体接口：`Domain`、`Category`、`Work`（含嵌套 `WorkDetail`）、`User`、`UserFavorite`、`UserHistory`、`UserWatchLater`。
- `enum.ts` — `NormalPageTemplate`、`WorkPageTemplate` 字面量联合。

消费方式：前端通过 `apps/web/src/types/{db-instance,enum}.ts` 两个**一行 re-export shim** 间接消费。`@/types/db-instance` 的现有 import 全部不变。新代码建议直接 `import { ... } from "@torchive/shared"`。

后端当前**不**消费 shared —— TypeORM 实体类是独立源。后续若要让实体 `implements SharedXxx`，需逐字段对齐，spec 见 `.claude/specs/next-steps.md`。

### 前端：`apps/web/`

- `src/api/` — 类型化 API 层。`request.ts` 是基于 axios 的 `createInstance(config)` 工厂，拦截器把 axios 错误归一化为 `CustomError<BackendErrorResponse>`。`shared.ts` 导出 `webHttp` 与 `TsResponse<T> / TsItemResponse<T>`。`works/domains/categories/details/users/user-favorites/...` 按域分文件；`index.ts` 聚合；旧 `web.ts` 是一行 shim 兼容。
- `src/types/` — 历史路径保留（re-export 自 shared）。`global.d.ts` 把 `Domain` 等提升为全局，业务代码中可直接使用无导入。
- `src/components/` — 自研 UI 库，统一通过 `src/components/index.ts` 导出。设计令牌见 `apps/web/docs/DESIGN.md`。
- `src/mappers/` — 把后端实体转成视图/资源 URL。`work.ts` 关键函数：`generateCoverUrl` / `mapWorkToBrief` / `parseEntitiesJson` / `transformEntities`。
- `src/views/{Web,User,Admin}/` — 三套页面壳。

### 后端：`apps/api/`

- `src/main.ts` + `app.module.ts` — 启动。
- `src/{domain,category,work,detail,user,user-favorite,user-history,user-watch-later}/` — 8 个业务模块，每个含 `*.module.ts / *.controller.ts / *.service.ts / entities/ / dto/`。
- `src/database/` — TypeORM 根配置。
- `src/common/` — `interceptors/`、`typeorm/`（通用 CRUD 工具）、`utils/`、`workers/`。
- `src/task/` + `src/startup/` — 启动期后台任务（扫描作品目录到数据库）。
- 端口 2333（默认），可通过 `.env` 调整。

### 别名与样式

- `@/` → `apps/web/src/`（Vite + tsconfig 都配）。
- `@torchive/shared` → `packages/shared/src/`（tsconfig.app.json 配；Vite 走 pnpm 软链）。
- 后端 `@/*` → `apps/api/src/*`（tsconfig + jest moduleNameMapper 都配）。
- 前端 Tailwind v4（`@tailwindcss/vite`），全局入口 `apps/web/src/index.css`。字体：全局 `HarmonyOS Sans SC`，后台页 (`AdminView`) 内联覆盖为 Geist 栈。
- 默认语言：中文。提交信息使用 emoji 前缀：`✨ feat` / `🎈 perf` / `🐛 fix` 等。

## Conventions

- 优先使用 **Edit** 修改现有文件，避免新建无关文档。
- 不要新增 CLAUDE.md / README 之外的说明文档（除 `.claude/specs/` 下的工作规格）。
- 修改跨模块代码（API + 类型 + Mapper + 页面）时按依赖顺序：先 `packages/shared/` → `apps/web/src/api/` → mapper → 组件。
- 设计系统严格遵循 `apps/web/docs/DESIGN.md`：避免饱和色、装饰性阴影、装饰性渐变；按钮/标签圆角优先 `9999px`/`26px`，输入框/卡片 `10px`/`14px`。
- 修改完成后运行 `pnpm lint && pnpm build` 验证。
- 详细历史与待办见 `.claude/specs/` 下两个 spec。
