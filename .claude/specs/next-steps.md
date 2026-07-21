# Next Steps Spec

工作 backlog，按优先级粗排。每项独立可做，互不阻塞。

## 状态

- ✅ **Batch 1**（2026-06-25）：实体对齐 shared / 后端 lint / 拆 mappers / WorkDetail 6 模板重构 → `next-steps-batch-1.md`
- ✅ **Batch 2**（2026-07-21）：URL 状态协议收尾（DomainOverviewView 全 path、IndexRedirect 老链接翻译、Music/Manga 写回 URL）→ `next-steps-batch-2.md`

---

## 1. 后端实体对齐 `@torchive/shared` — ✅ 已完成

> 详见 `next-steps-batch-1.md` 第 1 节。8 个 TypeORM 实体全部加 `implements SharedXxx`，`packages/shared` 放宽 `create_time` 为 `string | Date`。

---

## 2. 修后端 lint — ✅ 已完成

> 详见 `next-steps-batch-1.md` 第 2 节。25 errors 全部修完，`pnpm --filter @torchive/api lint` 0 errors。

---

## 3. WorkDetail 模板重构 — ✅ 已完成

> 详见 `next-steps-batch-1.md` 第 4 节。6 个模板共用 `WorkDetailShell` + `PosterCover` + `TabsPanel` + `FileListPanel`，总行数 -53%。

---

## 4. `src/mappers/work.ts` 拆分 — ✅ 已完成

> 详见 `next-steps-batch-1.md` 第 3 节。`mappers/work/{cover,brief,entities,constants}.ts`，20 个消费方零改动。

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

## 7. 测试基础设施 — 🟡 部分完成

**当前状态**：
- ✅ 前端 `vitest` 已装，4 个测试文件 / 21 tests passing（`mappers/work/{cover,brief,entities}` + `utils/shortHash`）
- ✅ 后端 `jest` 已有 8 个 spec / 25 tests passing（覆盖 8 个 service/controller）
- ⏳ 还没有 hook 级测试（`useMusicPlayState` / `useMangaPlayState` 等），需要 `jsdom` + `@testing-library/react`
- ⏳ 还没有 e2e / 集成测试

**剩余建议**：
- 补 hook 测试（`jsdom` + `@testing-library/react`）覆盖 URL 状态协议
- mapper 的 edge case（`generateCoverUrl` 缺 `is_orphan` / `cover` 等）
- 后端集成测试（目前 spec 都是单 service，跨 service / 跨 module 没覆盖）

**预估工作量**：持续投入。

---

## 8. CI / pre-commit — 🟡 部分完成

**当前状态**：
- ✅ husky + lint-staged 已装（`pnpm install` 自动 `prepare`）
- ✅ pre-commit hook 跑 `eslint --fix --max-warnings 0` + `prettier --write` on staged `.ts/.tsx`
- ⏳ GitHub Actions 未配（项目无 remote 时可暂缓）

**剩余建议**：
- 配 `.github/workflows/ci.yml`：跑 `pnpm install && pnpm lint && pnpm build && pnpm test`
- 需要 push remote 之后才能 enable

---

## 9. Ebook / Album / Mixture 双向 URL 状态 — 📌 增量

**Context**：Batch 2 给 Video / Music / Manga 上了写回 URL 能力。Ebook / Album / Mixture 三个模板在 `b31bb5b` 只接了只读 `initialFilePath`，**点击翻页/切章节/切媒体不会写回 URL**。

**预估**：
- **Ebook**：形态最接近 Manga（章节+页码），可参考 `useMangaPlayState` 做 `useEbookPlayState`。注意 Ebook 的"页"概念可能是 pdf/txt 章节内的字符位置 / pdf 页码 / epub chapterIndex，三者统一层很麻烦 —— 先想清楚是按文件级还是内容级
- **Album**：章节列表 → 图片列表，"翻页"在章节内的图片，URL 可以 `?chapter=<key>&image=<n>`（类似 Manga 但 image 而非 page）
- **Mixture**：混图/视频/pdf/音频，每章节可能是不同 media type。URL 状态比 Manga/Album 更复杂，可能需要 per-asset 分桶（`?asset=<hash>` + 额外 metadata）

**做法**：
- 先做 Ebook（形态最清晰）
- 再 Album（用 Manga 的模板）
- 最后 Mixture（单独设计，因为是异质 media 混排）

**依赖**：无，等做完可以再写一个 batch-3 spec。

---

## 工作流提示

- 改 `packages/shared/`：必跑 `pnpm --filter @torchive/web build` 验证消费方
- 改 `apps/api/`：必跑 `pnpm --filter @torchive/api build`
- 改 `apps/web/`：必跑 `pnpm --filter @torchive/web exec tsc -b && pnpm --filter @torchive/web lint && pnpm --filter @torchive/web build`
- 一次性全验：`pnpm lint && pnpm build`（后端 lint 已修；pre-commit hook 也会跑 eslint + prettier）
- 跑测试：`pnpm test`（web vitest 21 + api jest 25）
