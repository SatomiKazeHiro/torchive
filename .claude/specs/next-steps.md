# Next Steps Spec

工作 backlog，按优先级粗排。每项独立可做，互不阻塞。

## 1. 后端实体对齐 `@torchive/shared`（推荐先做）

**Why**：当前后端 TypeORM `@Entity()` 类是独立源，与 `packages/shared/` 里的 plain interface 形状可能漂移。shared 包"只为前端服务"违反单一来源原则。

**做法**：
- 把 `apps/api/src/{domain,category,work,detail,user,user-favorite,user-history,user-watch-later}/entities/*.entity.ts` 的每个类加上 `implements SharedXxx`（如 `DomainEntity implements Domain`）
- 形状不一致的字段：要么改 shared（推荐），要么改 entity（不推荐）
- 字段命名差异（如 `workCount` vs `work_count`）：TypeORM 通常用 snake_case 列名，TS 属性名可以保持 camelCase，**属性名对齐 shared** 即可
- 跑 `pnpm build` 验证

**风险**：
- 实体里可能用了一些 shared interface 没表达的字段（如 `password` 在 shared 是可选，后端是必填）。可以用 `Omit<SharedXxx, ...> & { extra: ...}` 解决。
- 后端 lint 配的 `recommendedTypeChecked` 会更严格地暴露 `any` —— 修 lint 与此同步进行收益最大。

**依赖**：`packages/shared/` 已就绪。

---

## 2. 修后端 lint（与 #1 同步做最划算）

**Why**：当前 `apps/api/eslint.config.mjs` 使用 `tseslint.configs.recommendedTypeChecked`，触发 25 errors：
- `no-unsafe-member-access` / `no-unsafe-assignment` / `no-unsafe-call`（rows 是 `any`）
- `no-unused-vars`（task.module.ts 多个 import）
- `restrict-template-expressions`（user.controller.ts:76, user.service.ts:309）
- 2 处 `'_' is assigned but never used`

**做法**：
- `apps/api/src/domain/{category,domain}.service.ts`：把 `rows: any[]` 改成实体类型或具体 shape
- `apps/api/src/task/task.module.ts`：删 unused imports
- `apps/api/src/user/user.controller.ts:76` 和 `user.service.ts:309`：用 `String(...)` 或类型 guard
- `apps/api/src/user/user.service.ts:230, 239`：删 `_` 占位
- `apps/api/src/main.ts:44`：补 `void` 或 `.catch()`

**验证**：`pnpm --filter @torchive/api lint` 0 errors。

---

## 3. WorkDetail 模板重构（option B）

**Context**：在 monorepo 之前的设计讨论里，用户希望"提高可读性、可扩展性"。`src/views/Web/WorkDetail/templates/` 下 6 个模板文件（`Video/Music/Manga/Ebook/Album/Mixture`）每个有重复的 layout 与 data-fetching 逻辑。

**建议方向**：抽一个 `WorkDetailTemplate` 通用壳，模板只声明差异部分（封面渲染 / 播放控件 / 分章导航 / 媒体列表）。

**预估工作量**：中。先读 `apps/web/src/views/Web/WorkDetail/templates/` 摸清当前 shape。

---

## 4. `src/mappers/work.ts` 拆分（option D）

**Context**：原前端 `src/mappers/work.ts` 在拆分讨论时发现包含 `generateCoverUrl`、`mapWorkToBrief`、`parseEntitiesJson`、`transformEntities` 等多组函数，文件较大。

**建议方向**：拆成 `mappers/work/cover.ts`、`mappers/work/brief.ts`、`mappers/work/entities.ts`（或类似粒度）。`apps/web/src/mappers/index.ts` 聚合。

**预估工作量**：小。先看 `apps/web/src/mappers/work.ts` 的函数分布。

---

## 5. PWA 支持

**Why**：用户提及"打包成 exe"前，可能更想要 PWA（offline 缓存媒体元数据、桌面快捷方式）。

**做法**：
- 装 `vite-plugin-pwa`
- 配置 manifest（icons, theme color, name）
- 配置 workbox runtime caching：API GET 走 NetworkFirst，资源 URL 走 CacheFirst
- ⚠️ 媒体文件可能很大，不要全缓存。建议只缓存 poster/cover + metadata

**依赖**：前端 6 个 template 的"全屏播放页"在 PWA standalone 模式下要保证可全屏 —— 需调整 `apps/web/index.html` 的 meta 与 service worker scope。

---

## 6. 桌面端打包（Electron / Tauri 评估）

**Context**：用户问过"是否支持应用端如 exe 之类的打包"。

**两个选项**：

| 方案 | 包大小 | 启动速度 | 接入成本 |
|---|---|---|---|
| Electron | ~150MB+ | 慢 | 低（Vite 集成现成） |
| Tauri | ~10MB | 快 | 中（需 Rust 工具链） |

**建议**：
- **Tauri 优先**（轻量、符合"极简"调性）。但要装 Rust 工具链（Windows 上需 `rustup-init`）。
- Electron 作为 fallback（如有 native module 兼容性问题）。

**集成点**：
- 前端 build 产物 (`apps/web/dist/`) 打包进桌面应用
- 后端要不要嵌进桌面？可选：可以继续走远程 API（更轻），或把 NestJS 嵌进去（更重）
- 媒体文件路径处理：桌面版可能要 File System Access API 选目录

**短期不阻塞** monorepo 工作，可以最后做。

---

## 7. 测试基础设施

**当前状态**：无 test 脚本，无 jest/vitest 框架。

**建议**：
- 前端装 `vitest` + `@testing-library/react`（与 Vite 集成好）
- 后端已有 `jest`（在 devDependencies）但无 spec 文件
- 优先写：API 层（`apps/web/src/api/`）的纯函数 mappers + 后端 service 的纯逻辑

**预估工作量**：高，是持续投入。

---

## 8. CI / pre-commit

**Why**：目前没有自动化检查，全靠手动跑 `pnpm lint && pnpm build`。

**建议**：
- 装 `husky` + `lint-staged`
- `pre-commit`: 对 staged .ts/.tsx 跑 `eslint --fix` + `prettier --write`
- （可选）GitHub Actions：跑 `pnpm install && pnpm lint && pnpm build`

---

## 工作流提示

- 改 `packages/shared/`：必跑 `pnpm --filter @torchive/web build` 验证消费方
- 改 `apps/api/`：必跑 `pnpm --filter @torchive/api build`
- 改 `apps/web/`：必跑 `pnpm --filter @torchive/web exec tsc -b && pnpm --filter @torchive/web lint && pnpm --filter @torchive/web build`
- 一次性全验：`pnpm lint && pnpm build`（注意后端 lint 当前有 pre-existing errors，见 monorepo-setup.md）
