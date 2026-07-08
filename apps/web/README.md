# Torchive Admin

Torchive 管理后台前端项目，提供媒体资源的可视化数据管理功能。

## 功能特性

- **主题管理** - 查看和编辑内容主题配置，包含资源统计信息
- **分类管理** - 管理各主题下的分类，支持筛选和搜索
- **媒体管理** - 浏览和管理媒体资源，支持多维度筛选
- **仪表盘** - 系统数据概览与资源分布统计

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **组件库**: 自研组件（Button, Input, Table, Modal, Select, Switch, Card 等）
- **状态管理**: ahooks (useRequest, useDebounce 等)
- **图标**: React Icons

## 设计风格

现代简约扁平风格，特点：

- **色彩克制**：使用 zinc 中性色系（zinc-50/100/200/500/700/900）
- **细线条边框**：统一使用 `border-zinc-200 dark:border-zinc-800`
- **极淡阴影**：`shadow-[0_1px_2px_rgb(0,0,0,0.02)]`
- **大量留白**：卡片式布局，强调信息层级
- **功能图标**：线性风格，色彩仅用于状态提示

## 项目结构

```
src/
├── api/              # API 接口封装
├── components/       # 通用组件库
├── types/            # TypeScript 类型定义
├── views/
│   └── Admin/
│       ├── Dashboard/      # 仪表盘
│       ├── Domain/         # 主题管理
│       ├── Category/       # 分类管理
│       └── Media/          # 媒体管理
└── main.tsx
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 环境配置

开发时代理配置（vite.config.ts）：

```typescript
server: {
  proxy: {
    '/ts-api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 后端接口

项目依赖 Torchive Server 提供数据接口，主要接口包括：

- `GET/POST /ts-api/domains/*` - 主题相关接口
- `GET/POST /ts-api/categories/*` - 分类相关接口  
- `GET/POST /ts-api/works/*` - 媒体资源相关接口

## License

MIT
