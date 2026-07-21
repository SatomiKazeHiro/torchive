# Next Steps Batch 2 Spec

## Status: ✅ Completed 2026-07-21

URL 状态协议收尾。DomainOverviewView 切到全 path 路由 + Music/Manga 模板加上写回 URL 能力 + 老链接翻译。3 个 commit：

| commit | 说明 |
|---|---|
| `f4ca7ea` | 主题分类列表路由优化（DomainOverviewView + IndexRedirect 主体改动） |
| `7c6af73` | 内容、样式优化（DomainOverviewView 视觉细节） |
| `3724457` | Music 模板双向 URL 状态 |
| `bda0d86` | Manga 模板双向 URL 状态 |

> 这次 spec 顺带把 Batch 1 之后没文档化的前置 commit 也补上背景。

## 背景：URL 状态协议三阶段

| 阶段 | commit | 范围 | 语义 |
|---|---|---|---|
| 1 | `1ccc230` | Video 模板 | 第一个支持写回 URL 的播放模板（`?tab=&asset=<shortHash>`） |
| 2 | `b31bb5b` | 5 个非 Video 模板 | 全部接 `initialFilePath` 只读；首屏 deep link 可，但点击不写回 |
| 3 | 本批次 | DomainOverviewView + Music + Manga | DomainOverviewView 全 path；Music/Manga 写回 URL；老链接翻译 |

> 阶段 3 让 URL 成为整个浏览+播放路径上的"唯一真源"：从列表 `/:domain/:category` → 详情 `/:domain/:category/:id` → 播放 `/:domain/:category/:id/play?asset=<hash>`，每一步的 URL 都能 share/reload。

---

## 1. DomainOverviewView 全 path 路由

### 改动文件

- `apps/web/src/views/Web/Domain/DomainOverviewView.tsx` — handlers 切到 `navigate()`，去双模式
- `apps/web/src/views/Web/utils/IndexRedirect.tsx` — 老 `/index/*` 链接翻译

### 关键决策

**Q: 为什么全部用 path？**

旧设计：`selectedDomain = pathDomain || searchParams.get("domain") || "all"`，path 优先 + query 兜底。问题：

- 双重真源：URL 不再是 single source of truth
- 行为不一致：handler 一律 `setSearchParams`，从不 `navigate`，所以在 `/:domain` 上点其他 domain 过滤器会**不生效**（path 永远赢 query）
- 老链接 `/index?domain=X` 已经要靠重定向翻译，没必要保留 query 协议

新设计：path 唯一驱动 domain/category，query 只承担 page。三个 handler 行为清晰：

| handler | 作用 | URL 行为 |
|---|---|---|
| `handleDomainChange(id)` | 切主题 | `navigate("/" + id)` —— 自动丢 page |
| `handleCategoryChange(id\|null)` | 选/反选分类 | `navigate("/" + domain + "/" + id)` 或 `"/" + domain` —— 自动丢 page |
| `handlePageChange(p)` | 翻页 | `setSearchParams({ page })` —— path 不动 |

**Q: 主题去掉"全部"按钮，分类保留可反选 —— 这个不对称合理吗？**

合理。把"跨主题聚合"明确让给首页（`/`），DomainOverviewView 内只关心"已进入某个主题"。分类在 domain 内是细筛，UI 留出"反选 = 该 domain 全部"的逃生通道（点击已选中的分类按钮 = 取消）。对称设计（domain 也可反选）会让"全站总览"重复出现在每个 domain 页面内，职责不清。

**Q: `pathDomain` 是 `string \| undefined`，TypeScript 怎么过？**

虽然路由只在该 component 满足 `:domain` 时挂载，`useParams` 返回类型仍是 `string | undefined`。`fetchWorks(page, undefined, ...)` 不通过 type check，所以 retry 按钮加了 `if (!selectedDomain) return;` 守卫。运行时不会出现 undefined 路径（路由保证），加守卫是纯类型适配。

**Q: `categories.length > 0` 才渲染分类行，会不会"该 domain 没分类"时 UI 不一致？**

预期行为：domain 有 0 个 category 时，确实没有可筛选项，整个分类行隐藏 + URL 也无 category 段。视为"全量"。

### 关键设计 trade-off

| 旧（双模式） | 新（全 path） |
|---|---|
| 双重真源 | URL 唯一 |
| handler 行为不对称 | handler 行为统一（navigate / setSearchParams 各管一段） |
| 老 `/index?domain=X` 直接当 query 处理 | 老链接走 `IndexRedirect` 翻译成 `/X` |
| "全部"按钮存在于两边 | 主题无"全部"，分类可反选 |

---

## 2. IndexRedirect 老链接翻译

### 改动文件

- `apps/web/src/views/Web/utils/IndexRedirect.tsx` — 把 query 形式的老 URL 翻译成 path 形式

### 翻译规则

| 老 URL | 新 URL |
|---|---|
| `/index` | `/` |
| `/index?domain=X` | `/X` |
| `/index?domain=X&category=Y` | `/X/Y` |
| `/index/X/Y/Z` | `/X/Y/Z` |
| `/index/X/Y/Z/play` | `/X/Y/Z/play` |
| `/index?domain=X&page=N` | `/X`（page 是 ephemeral 状态，迁移时丢弃） |

### 关键决策

**Q: 为什么丢弃 `page` 参数？**

`page` 是分页序号，依赖 filter 上下文，跨上下文无意义。`?domain=X&page=2` → `/X` 用户重新落到第 1 页，符合"老链接 → 新页面"的最小承诺原则。Q3 search 里如果有相关 `q` 参数也可以类似处理（当前没这个参数）。

---

## 3. Music 模板双向 URL 状态

### 改动文件

- `apps/web/src/views/Web/WorkPlay/templates/Music/useMusicPlayState.ts` (new) — 短 hash ↔ playlist path
- `apps/web/src/views/Web/WorkPlay/templates/Music/hooks/usePlaylist.ts` — 瘦身成纯数据 hook
- `apps/web/src/views/Web/WorkPlay/templates/Music/hooks/useMusicPlayer.ts` — 组合 useMusicPlayState + 精简 usePlaylist
- `apps/web/src/views/Web/WorkPlay/templates/Music/hooks/index.ts` — re-export useMusicPlayState

### 关键设计

**URL 编码：`?asset=<shortHash>`**

- 用 8 字符 base32 短 hash（`utils/shortHash`）代替全路径，URL 长度可控（典型 `?asset=00r462bt`）
- 短 hash 双向查表（`hashToPath: Map<hash, path>` + `pathToHash: Map<path, hash>`）在 hook 内 `useMemo` 缓存

**状态推算优先级**：

1. URL 上合法 hash → 用它
2. `initialAssetPath` 命中歌单 → 用它（首次进入时回填 URL）
3. `playlist[0]?.path`

**silent rewrite**：`useEffect` 在 URL 偏离状态时用 `setSearchParams(next, { replace: true })` 静默回写，不污染历史栈

### 关键决策

**Q: 为什么不把 `currentTime` 也入 URL？**

音频播放位置是 ephemeral 状态（每秒钟都变），入 URL 会让 history 步进变成"上一页 = 上一首歌 + 上一秒"的诡异行为。`?asset=` 只承担"哪一首歌"这个稳定的 session identity。

**Q: usePlaylist 为什么不直接接收 currentIndex 参数？**

保持 usePlaylist 纯数据（一个 domain 输入一个 domain 输出），URL 状态由 useMusicPlayState 单独管。两个 hook 单测更容易，且职责清晰：usePlaylist 只问"有哪些歌"，useMusicPlayState 只问"现在该播哪首"。

---

## 4. Manga 模板双向 URL 状态

### 改动文件

- `apps/web/src/views/Web/WorkPlay/templates/Manga/useMangaPlayState.ts` (new)
- `apps/web/src/views/Web/WorkPlay/templates/Manga/index.tsx` — 替换 `state.currentPage/currentChapterIndex`

### 关键设计

**URL 编码：`?chapter=<unitKey>&page=<n>`**

- `chapter` 直接用 `ChapterUnit.key`（形如 `unit_assets` / `unit_section_0` / `unit_orphan`），已是短稳定字符串，**不做 hash**
- `page` 用 1-based 数字（可读性优先于紧凑性，便于 debug）

**状态推算优先级**：

chapter:
1. URL 上合法且匹配 `unit.key` → 用它
2. `initialFilePath` 命中某 unit 的 files → 用它
3. 第一个 unit

page:
1. URL 上合法且在 `[1, totalPages]` → 用它
2. `initialFilePath` 命中当前 chapter 的某一页 → 用它
3. 1

**setChapterIndex 重置 page**：`writeState(chapterIdx, 1)` —— 切章节时 page 必然重置到 1，避免 `?chapter=X&page=5` 在新 chapter 下越界。

**条漫滚动不入 URL**：strip-mode 滚动时 `visibleImageIndex` 频繁变化，不写 URL。仅在 single 模式翻页 + 章节切换 + strip→single 切换时同步。

### 关键决策

**Q: autoPlay 的 setInterval 怎么读到最新 URL 状态？**

URL 状态不再是 React state 的一份 mirror，而是 truth source。setInterval 的回调闭包创建时绑定了当时的 state，闭包内读 `currentPage` 是 stale 的。

解法：`urlStateRef = useRef({ currentPage, currentChapterIndex, totalPages, isLastChapter })`，另起 `useEffect([deps])` 在每次 render 后把最新值同步进 ref。setInterval 回调从 `urlStateRef.current` 读，永远新鲜。

不用 `useEffectEvent`（React 19 仍未 GA）、不用"重启 interval 跟 state 变化"（开销大），refs 模式最简。

**Q: 章节切换时 setImageHeights({}) 为什么从 handler 移到 useEffect？**

旧代码在 `handlePrevChapter / handleNextChapter / handleChapterSelect` 三处手动 `setImageHeights({})`。URL 化后切换章节都走 `setChapterIndex`，手动 reset 散在调用方。新写法用 `useEffect([currentChapterIndex])` 自动 reset —— 单一关注点，URL 状态是唯一触发器，新增入口（深链、prev/next、autoPlay）零额外代码。

**Q: 为什么不把 `mode`（single/strip）也入 URL？**

mode 已在 localStorage 持久化（`manga-reader-settings`），用户期望"我下次打开还看到上次的模式"，不是"我分享的链接锁死模式"。URL 不存 mode 让分享更轻、不锁死阅读偏好。

---

## 5. 整体验证

- `pnpm --filter @torchive/web lint`：0 errors（1 pre-existing ThemeContext warning 不相关）
- `pnpm --filter @torchive/web build`：OK（bundle 1029KB → 1029KB，几乎无变化）
- `pnpm test`：4 web test files (21) + 8 api test files (25) 全绿

---

## 6. URL 协议全表（最终态）

| 路由 | URL 形态 | 写回策略 |
|---|---|---|
| `/:domain` | `?page=<n>` | page 用 setSearchParams |
| `/:domain/:category` | `?page=<n>` | page 用 setSearchParams |
| `/:domain/:category/:id` | （无 URL state） | — |
| `/:domain/:category/:id/play` (Video) | `?tab=&asset=<shortHash>` | setSearchParams |
| `/:domain/:category/:id/play` (Music) | `?asset=<shortHash>` | setSearchParams |
| `/:domain/:category/:id/play` (Manga) | `?chapter=&page=` | setSearchParams |
| `/:domain/:category/:id/play` (Ebook/Album/Mixture) | （只读，详见 next-steps.md #9） | — |
| `/index/*` 老链接 | — | `IndexRedirect` 翻译 |

> 协议原则：所有"哪些内容在视口内"的状态（tab / chapter / page / asset）都入 URL；所有"用户偏好"（mode / volume / fontSize）都留 localStorage。URL 只承担 share / reload / back-forward 的能力，不承担个性化记忆。

---

## 7. 已知遗留

- **Ebook/Album/Mixture 写回 URL**（见 `next-steps.md` #9）—— 等做完再写 batch-3
- **URL hook 单测** —— 需要 jsdom + RTL，目前没有
- **Manga 自动播放跨章节的图片高度初始化** —— `setImageHeights({})` 触发后第一次滚动会闪一下默认估算高度（DEFAULT_ESTIMATED_HEIGHT），待复盘
