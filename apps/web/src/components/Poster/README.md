# PosterV2

`PosterV2` 是用于展示封面图的懒加载组件。它会在图片进入视口后加载资源，并在图片加载完成后根据图片原始宽高判断横竖方向，再决定容器比例和图片填充方式。

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | - | 图片地址。 |
| `alt` | `string` | `""` | 图片替代文本。 |
| `ratio` | `string` | - | 可选比例，例如 `"3/4"`、`"2/3"`、`"16/9"`。 |
| `fallbackRatio` | `number \| string` | `0.74` | 未传 `ratio` 且容器高度塌缩时使用的兜底比例。 |
| `landscapeInset` | `boolean` | `false` | 横板凹陷。开启后，横板图片不使用 `ratio`，宽度占满，高度自然撑开。 |
| `className` | `string` | - | 外层容器 class。 |
| `imgClassName` | `string` | - | 图片 class。 |

## Rendering Rules

- 图片默认懒加载：只有进入视口后才会开始渲染 `<img>`。
- 图片加载成功后，通过 `naturalWidth` 和 `naturalHeight` 判断方向。
- `ratio` 优先级高于 `fallbackRatio`。
- `fallbackRatio` 只在未传 `ratio` 且容器高度塌缩时启用。
- 只有 `shouldUseRatio && isPortrait` 时，图片才会 `object-cover` 并铺满比例容器。
- 横板图片默认仍可使用比例容器，但图片尺寸为 `w-full h-auto`。
- 开启 `landscapeInset` 后，横板图片会取消比例容器，使用自然高度撑开。

## Flow

```mermaid
flowchart TD
  A["PosterV2 渲染"] --> B{"src 是否变化?"}
  B -- "是" --> C["重置加载状态"]
  B -- "否" --> D["保持当前状态"]

  C --> E{"是否有 src?"}
  D --> E

  E -- "否" --> P["显示占位图"]
  E -- "是" --> F{"是否进入视口?"}

  F -- "否" --> P
  F -- "是" --> G["渲染 img 并开始加载"]

  G --> H{"图片加载成功?"}
  H -- "否" --> I["设置 error=true"]
  H -- "是" --> J["读取 naturalWidth / naturalHeight"]

  J --> K{"naturalWidth < naturalHeight?"}
  K -- "是" --> L["isPortrait=true"]
  K -- "否" --> M["isLandscape=true"]

  L --> N["解析 ratio"]
  M --> N

  N --> O{"landscapeInset && isLandscape?"}
  O -- "是" --> Q["shouldUseRatio=undefined"]
  O -- "否" --> R["shouldUseRatio=ratio 或 fallbackRatio"]

  Q --> S["容器不设置 aspectRatio"]
  R --> T{"是否存在 shouldUseRatio?"}

  T -- "是" --> U["容器设置 aspectRatio"]
  T -- "否" --> V["容器 h-full w-full"]

  U --> W{"是否为 isPortrait?"}
  W -- "是" --> X["img: block h-full w-full object-cover"]
  W -- "否" --> Y["img: h-auto w-full"]

  S --> Z["横板凹陷：img block h-auto w-full"]
  V --> AA["img: h-full w-auto max-w-full object-contain"]
```

## Examples

```tsx
<PosterV2 src={cover} alt={title} ratio="3/4" />
```

```tsx
<PosterV2 src={cover} alt={title} ratio="3/4" landscapeInset />
```
