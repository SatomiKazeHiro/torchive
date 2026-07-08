# Next Steps Batch 1 Spec

## Status: ✅ Completed 2026-06-25

按 `next-steps.md` 第 1~4 项一次性完成。后端实体对齐 + 后端 lint + 拆 mappers + WorkDetail 模板重构。

## 1. 后端实体对齐 `@torchive/shared`

### 改动文件

**配置层（新增依赖）**
- `apps/api/package.json` —— 加 `"@torchive/shared": "workspace:*"`
- `apps/api/tsconfig.json` —— `paths` 加 `"@torchive/shared": ["../../packages/shared/src"]`

**共享类型（唯一一处放宽）**
- `packages/shared/src/db-instance.ts` —— `Work.create_time` / `User` / `UserFavorite` / `UserHistory` / `UserWatchLater` 的 `create_time` / `update_time` 由 `string` 放宽为 `string | Date`，匹配 TypeORM `@CreateDateColumn()` 实际返回 `Date`。

**8 个实体（全部加 `implements SharedXxx`）**
- `apps/api/src/{domain,category,work,detail,user,user-favorite,user-history,user-watch-later}/entities/*.entity.ts`
- 一律用 `import type { Xxx as SharedXxx }` 别名导入，规避本地类名与 shared 接口同名冲突（否则 TS2440: Import declaration conflicts）。
- `Work` 实体补 `@CreateDateColumn() create_time` —— 此前缺失该列。

### 关键决策

**Q: shared 用 `string | Date` 还是 `Omit<SharedXxx, ...> & { extra }`？**

选前者。理由：
- 后端 `synchronize: true`，新列自动加；Omit 反而让类型与 schema 长期不一致
- 前端消费方均使用 `new Date(...)`，本就兼容两者
- 比 Omit 写法更轻、更易读

**Q: 是不是改 shared "优先"？**

规范说"形状不一致字段，要么改 shared（推荐）"。这里 `create_time: string` 严格说不是不一致，而是 TypeORM 的实现细节在渗漏。所以选了一个折中：**改 shared 的 union，不动 entity 字段名**。

### 验证

`pnpm --filter @torchive/api build` 0 errors。

---

## 2. 修后端 lint 25 errors

### 改动文件

| 文件 | 修复 |
|---|---|
| `apps/api/src/category/category.service.ts` | 加 `CategoryStatsRow` 接口替换 `row: any` |
| `apps/api/src/domain/domain.service.ts` | 加 `DomainStatsRow` 接口替换 `row: any` |
| `apps/api/src/main.ts` | `bootstrap()` → `void bootstrap()` |
| `apps/api/src/task/task.module.ts` | 删 `TypeOrmModule` / `Domain` / `Category` / `Work` / `Detail` 未用 import |
| `apps/api/src/user/user.controller.ts:76` | `\`avatar.${uid}${ext}\`` → `\`avatar.${String(uid)}${ext}\`` |
| `apps/api/src/user/user.service.ts:230, 239` | `const { password: _, ...result }` → `_password` + `void _password` |
| `apps/api/src/user/user.service.ts:309` | `\`User<${uid}> not found\`` → `\`User<${String(uid)}> not found\`` |

### 副作用

由于共享类型放宽到 `string | Date`，前端 2 处本地接口需同步放宽：
- `apps/web/src/views/User/history/HistoryView.tsx` —— `HistoryItem.create_time` / `update_time` / `formatTime` 签名
- `apps/web/src/views/User/WatchLater/WatchLaterView.tsx` —— `WatchLaterItem.create_time`
- `apps/web/src/views/User/components/TimelineLayout.tsx` —— `TimelineLayoutProps.getTime`
- `apps/web/src/views/User/utils/date-group.ts` —— `getDateLabel` / `groupByDate.getTime`

### 验证

`pnpm --filter @torchive/api lint` exit 0（0 errors）。

---

## 3. 拆 `mappers/work.ts`

### 新结构

```
apps/web/src/mappers/
├── index.ts                          # 顶层聚合
└── work/
    ├── index.ts                      # namespace barrel
    ├── constants.ts                  # RESOURCE_PATH
    ├── cover.ts                      # generateCoverUrl
    ├── brief.ts                      # mapWorkToBrief + WorkBrief
    └── entities.ts                   # parseEntitiesJson + transformEntities
```

### 兼容性

- 删 `mappers/work.ts`
- 创建 `mappers/work/index.ts`（TypeScript 解析 `@/mappers/work` 自动落到这里）
- 20 个 `@/mappers/work` 消费方零改动

---

## 4. WorkDetail 6 模板重构

### 设计思路

观察 6 模板的重复模式：
- **头部**（封面 / 标题 / 面包屑 / 简介 / 更新时间 / 操作按钮）：6 个模板几乎一致，只差封面渲染 + 主按钮文案
- **中部**：分 3 派
  - `Mixture` / `Music` / `Ebook` —— Tabs + 分页文件列表（每页 10 条 + 自定义图标）
  - `Video` —— Tabs + 分页视频网格（每页 12 + 视频封面匹配）
  - `Manga` —— Tabs + 加载更多图片网格（无分页 / 单 tab 时隐藏 tabs 头）
  - `Album` —— 章节列表 → 图片列表（无 tabs / 章节单元导航）

### 抽出的 4 个组件

| 组件 | 职责 |
|---|---|
| `components/WorkDetailShell.tsx` | 通用壳：cover slot + 标题 + 面包屑 + 简介 + 更新时间 + 主按钮 + 收藏/稍后再看 + children 中部区域 |
| `components/PosterCover.tsx` | 标准海报封面（160/200px 响应 + 3:4）—— 5 模板共用 |
| `components/TabsPanel.tsx` | Tabs 壳（支持泛型扩展字段，如 Video 需要 `allFiles`）+ `showTabsWhenSingle` 选项 |
| `components/FileListPanel.tsx` | 分页文件列表（Mixture/Music/Ebook 共用，`renderIcon` 注入自定义图标） |

### 各模板重构后行数

| 模板 | 前 | 后 | 备注 |
|---|---|---|---|
| MixtureTemplate | ~270 | ~70 | 完全用 Shell + TabsPanel + FileListPanel |
| MusicTemplate | ~290 | ~110 | + 内嵌 VinylCover 组件 |
| EbookTemplate | ~265 | ~85 | 完全共用三件套 |
| VideoTemplate | ~305 | ~180 | 内嵌 VideoGrid（封面匹配逻辑保留） |
| MangaTemplate | ~325 | ~150 | 内嵌 ImageGrid + LazyImage |
| AlbumTemplate | ~415 | ~290 | 内嵌章节列表逻辑（结构差异最大） |
| **合计** | **~1870** | **~885** | **-53%** |

### 关键决策

**Q: 为什么 `TabsPanel` 要泛型化？**

Video 的 tab 需要额外 `allFiles` 字段（用于封面匹配）。`TabsPanel<T extends FileTab>` 让 Video 的 `renderTabContent` 能拿到 `tab.allFiles`，同时不污染 `FileTab` 接口。

**Q: Video/Manga/Album 为什么不也用 `FileListPanel`？**

- Video：网格 + 视频封面匹配，分页 12/页而非 10/页，逻辑差异大
- Manga：图片懒加载 + 加载更多模式（不是分页），单 tab 时隐藏 tabs 头
- Album：完全不是 tabs，是章节列表 → 单章节图片列表

抽到 `FileListPanel` 这一层即可，再往上抽象会让 `renderTabContent` 签名变复杂。

**Q: 内嵌 VinylCover / LazyImage / ImageGrid 为什么不抽？**

它们只在单个模板里使用。过早抽象 = 引入"未来可能用到"的代码，违反当前 CLAUDE.md 的指引（`Don't add features... beyond what the task requires`）。真出现复用需求时再抽。

### 验证

- `pnpm --filter @torchive/web lint` 0 errors（1 pre-existing warning on ThemeContext）
- `pnpm --filter @torchive/web build` OK
- Bundle: 1041KB → 1028KB（gzip 303KB）
- `pnpm lint && pnpm build` 全量 OK

---

## 待办（未做，留给后续 spec）

来自 `next-steps.md` 剩余：
- 第 5 项 PWA 支持
- 第 6 项 桌面端打包（Tauri 优先）
- 第 7 项 测试基础设施
- 第 8 项 CI / pre-commit