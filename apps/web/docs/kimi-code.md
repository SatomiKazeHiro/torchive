# 设计要求

> 我们即将设计开发页面，请熟知以下风格。



## UI

### 现代简约扁平风格

请设计一套现代简约扁平风格的UI，整体视觉清爽干净，以大量留白和卡片式布局分隔信息，使用无渐变的纯色块与细线条，搭配轻微圆角与极淡阴影营造轻质感；强调信息层级与可读性，功能图标采用线性风格，色彩克制且仅用于状态与交互提示，整体风格偏向功能导向、高效实用的工具类界面，避免过度装饰与复杂视觉效果。

---

**色彩与材质（Color & Texture）**

- 色彩克制 ：将原来组件中大面积使用的鲜艳主题色（如 blue-500）替换为高对比度的极简中性色（zinc-900 黑 / white 白），仅在诸如输入框聚焦（Focus）、选中高亮（Active）等强交互状态下保留极淡或克制的主题色提示。
- 背景与边框 ：全量将 gray 替换为视觉上更干净、略带冷峻现代感的 zinc 色系。全面采用细线条边框（border border-zinc-200），去除所有不必要的背景渐变。
- 极淡阴影 ：去除了原有的重阴影（如 shadow-2xl、shadow-md），统一替换为极其轻微的轻质感阴影（如 shadow-[0_1px_2px_rgb(0,0,0,0.05)] 这个阴影已在 `tailwind.config.js` 中定义为 `2xs-soft`），使组件呈现“悬浮”的轻盈感。



## 工程说明

后端工程 `torchive-server` 对本地文件识别，生成扫描数据，不支持操作本地文件的增删改查，只对生成数据的基础上在前端工程 `torchive` 中进行二次编辑、展示。

前端开发要求：

- 图标统一为 `react-icons/bi`
- 前端开发可以用库 `ahooks`、`es-toolkit` 进行优化
- 关于 `TailwindCss` 的样式合并可以使用 `@/components/utils/common` 下的 `cn`
- 在 `@/utils/fileHelper` 下有一些对文件的如判断类型、过滤等的常用操作，没有时可以在这个地方增加



## 工程常用代码位置

前端工程：torchive
后端工程：torchive-server
前端组件：torchive\src\components\index.ts
前端变量：torchive\src\constants
前端工具：torchive\src\utils
前端TS类型：torchive\src\types