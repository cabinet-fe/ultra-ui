# @veltra/icons

SVG 图标组件库。原始 SVG 文件通过 `scripts/gen-vue-icons.ts` 自动转换为 Vue SFC。

## 子路径

| 子路径 | 内容 |
|--------|------|
| `@veltra/icons` | 全部图标（normal + colorful） |
| `@veltra/icons/normal` | 单色图标（可通过 CSS `color` 控制颜色） |
| `@veltra/icons/colorful` | 多色图标 |

## 导入

```ts
// 按需导入
import { Search, Close, ArrowDown } from '@veltra/icons/normal'
import { Logo } from '@veltra/icons/colorful'
```

## 用法

图标是标准 Vue SFC 组件，使用方式与普通组件一致：

```vue
<script setup lang="ts">
import { Search, Close, ArrowDown } from '@veltra/icons/normal'
</script>

<template>
  <!-- 直接使用 -->
  <Search />

  <!-- 通过 CSS 控制颜色（normal 图标） -->
  <Search style="color: #1890ff; font-size: 20px" />

  <!-- 配合 UIcon 组件使用（推荐） -->
  <u-icon :size="20">
    <Search />
  </u-icon>

  <!-- 在按钮中使用 -->
  <u-button type="primary">
    <template #icon>
      <Search />
    </template>
    搜索
  </u-button>

  <!-- 条件渲染不同图标 -->
  <component :is="loading ? Loading : Search" />
</template>
```

## 与 UIcon 配合

`UIcon` 是 Veltra 的图标容器组件，提供统一尺寸、颜色和可访问性：

```vue
<template>
  <u-icon :size="16" color="primary">
    <Search />
  </u-icon>

  <!-- 等价于用 style 控制，但更语义化 -->
  <Search style="color: var(--u-color-primary); width: 16px; height: 16px" />
</template>
```

UIcon Props：
- `size?: number | string` — 图标尺寸（px）
- `color?: ColorType | string` — 图标颜色

## colorful 图标

多色图标保留原始 SVG 的颜色信息，不受外部 CSS color 影响：

```ts
import { Logo, BrandIcon } from '@veltra/icons/colorful'
```

```vue
<template>
  <Logo :style="{ width: '120px', height: '40px' }" />
</template>
```

## Vite 自动导入

配置 `unplugin-vue-components` + `VeltraDesktopUIResolver` 后，可直接在模板中使用图标而无需手动 import：

```vue
<template>
  <!-- 自动导入 -->
  <Search />
  <Close />
  <ArrowDown />
</template>
```

---

## 相关文档

- desktop/components/icon.md — UIcon 组件用法
- vite.md — Vite 自动导入配置

