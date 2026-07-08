# Monorepo Setup Spec

## Status: ✅ Completed 2026-06-25

## What was done

合并 `D:\MGit-Projects\torchive`（前端）与 `D:\MGit-Projects\torchive-server`（后端）到 `D:\MGit-Accums\torchive` 单仓。原目录保留作 rollback 用。

## 新结构

```
D:\MGit-Accums\torchive\
├── apps/
│   ├── web/      # @torchive/web  (React 19 + Vite + Tailwind v4)
│   └── api/      # @torchive/api  (NestJS 11 + TypeORM + better-sqlite3)
├── packages/
│   └── shared/   # @torchive/shared  (纯 TS 类型)
├── .claude/
│   ├── settings.json   (合并了两侧 source 的 allowlist)
│   └── specs/          (本目录)
├── package.json        (根 workspace 脚本)
├── pnpm-workspace.yaml (packages: ['apps/*', 'packages/*'])
├── .gitignore
├── README.md
└── CLAUDE.md           (新仓的根级指引)
```

## 关键决策

### 1. `packages/shared` 用"shim 模式"接入前端

**做法**：把 `apps/web/src/types/db-instance.ts` 和 `enum.ts` 的内容原样搬到 `packages/shared/src/`，然后把前端这两个文件改写成一行 re-export shim：

```ts
// apps/web/src/types/db-instance.ts
export * from "@torchive/shared";
```

**为什么**：保持现有所有 `import { ... } from "@/types/db-instance"` 调用零改动；新代码建议直接 `import { ... } from "@torchive/shared"`。最小爆炸半径。

**配置**：
- `apps/web/package.json` 加 `"@torchive/shared": "workspace:*"`
- `apps/web/tsconfig.app.json` 加 `paths` 映射：`"@torchive/shared": ["../../packages/shared/src"]`
- Vite 不需要 alias —— pnpm 软链 `node_modules/@torchive/shared` → `packages/shared`，Vite 自动解析

### 2. 后端**不**消费 `@torchive/shared`（本阶段）

**为什么**：后端的实体是 TypeORM `@Entity()` 装饰类，跟 plain interface 的形状可能漂移。强制 `implements SharedXxx` 会在形状不一致时 build 失败，且修复面广。这部分留作下一步 spec。

### 3. 包名重命名

- `torchive` → `@torchive/web`
- `torchive-server` → `@torchive/api`
- 新增 `@torchive/shared`

后端脚本**未**重命名（`start:dev`、`build`、`lint` 等保持原样），根脚本直接引用 `start:dev`。

### 4. pnpm workspace 配置

- 根 `pnpm-workspace.yaml`: `packages: ['apps/*', 'packages/*']`
- `allowBuilds.better-sqlite3: true`（后端需要原生构建）
- 旧的 `core-js: true / es5-ext: false / esbuild: false` 保留（前端的 Vite/esbuild 用）

### 5. 根脚本

```json
{
  "dev": "concurrently -n web,api -c blue,green \"pnpm dev:web\" \"pnpm dev:api\"",
  "dev:web": "pnpm --filter @torchive/web dev",
  "dev:api": "pnpm --filter @torchive/api start:dev",
  "build": "pnpm -r --filter @torchive/web --filter @torchive/api build",
  "lint": "pnpm -r --filter @torchive/web --filter @torchive/api lint",
  "typecheck": "pnpm -r ... typecheck",
  "clean": "pnpm -r exec rm -rf dist"
}
```

加了 `concurrently@^9` 到根 devDependencies。

## 验证结果

| 步骤 | 结果 |
|---|---|
| `pnpm install` | ✅ 926 packages，3min 58s，better-sqlite3 原生构建 OK |
| `pnpm --filter @torchive/web exec tsc -b` | ✅ 0 errors |
| `pnpm --filter @torchive/web build` | ✅ 6.38s，1248 modules，dist/ 完整 |
| `pnpm --filter @torchive/api build` | ✅ 0 errors，dist/ 完整 |
| `pnpm dev:api` + `curl :2333/works/page` | ✅ 200 |
| `pnpm dev:web` + `curl :5173/` | ✅ 200 |
| Vite 代理 `POST :5173/ts-api/works/page` | ✅ 201（透传到后端） |

### ⚠️ 注意：后端 lint 有 25 errors / 7 warnings

这些是**迁移前就存在**的 `@typescript-eslint/no-unsafe-*` 报错（`any` 类型问题），不是迁移引入的。eslint 配置文件 `apps/api/eslint.config.mjs` 已和原仓对比过，未改动。建议后续在 `next-steps.md` 里作为单独 spec 处理（"修后端 lint"）。

前端 lint 无 error。

## 端到端启动

```bash
cd D:\MGit-Accums\torchive
pnpm install
pnpm dev          # 同时起前端 :5173 + 后端 :2333
```

打开 `http://localhost:5173` 即可。

## Rollback

如不满意：
```bash
rm -rf D:\MGit-Accums\torchive
```

`D:\MGit-Projects\torchive` 与 `D:\MGit-Projects\torchive-server` 完好保留，仍可独立运行。

## 修改清单

### 新增文件
- `package.json`（根）
- `pnpm-workspace.yaml`（根）
- `.gitignore`（根）
- `.claude/settings.json`（合并源 settings）
- `.claude/specs/monorepo-setup.md`（本文件）
- `.claude/specs/next-steps.md`（待办）
- `README.md`（根）
- `CLAUDE.md`（根）
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/db-instance.ts`
- `packages/shared/src/enum.ts`
- `packages/shared/src/index.ts`

### 修改文件
- `apps/web/package.json` — `name: "torchive"` → `"@torchive/web"`，加 `"@torchive/shared": "workspace:*"`
- `apps/web/src/types/db-instance.ts` — 改为 `export * from "@torchive/shared";`
- `apps/web/src/types/enum.ts` — 改为 `export * from "@torchive/shared";`
- `apps/web/tsconfig.app.json` — 启用 `paths`，加 `@torchive/shared` 映射
- `apps/api/package.json` — `name: "torchive-server"` → `"@torchive/api"`

### 删除文件
- `apps/web/pnpm-workspace.yaml`（根接管 workspace 配置）
- `apps/web/node_modules/`、`dist/`、`pnpm-lock.yaml`（install 重新生成）
- `apps/web/.claude/`（合并到根）
- `apps/api/node_modules/`、`dist/`、`package-lock.json`（改用 pnpm）
- `apps/api/.claude/`、`database/`、`upload-files/`（运行时目录不入仓）
- `apps/api/.npm-cache/`、`.codegraph/`、`.mcp.json`
