---
title: "@veltra/icons 图标库"
description: "Vue 3 矢量图标库：从 @veltra/icons/normal（205 个单色线性图标）与 @veltra/icons/colorful（13 个多色图标）子路径按名称导入 Vue SFC 图标组件，裸 svg 无宽高，配合 UIcon 渲染或直接加 SVG 属性。"
aliases: [icons, veltra-icons, 图标库, 图标, SVG 图标, Icon]
keywords: ["@veltra/icons", "@veltra/icons/normal", "@veltra/icons/colorful", packageName, UIcon, currentColor, PascalCase, kebab, FormInput, CircleCheck, 按需导入, 图标命名, 单色图标, 多色图标, 图标检索, 组件名推导]
---

# @veltra/icons 图标库

`@veltra/icons` 把 SVG 源文件编译成可 tree-shake 的 Vue SFC 图标组件。每个图标是独立具名导出的 Vue 组件，分两个集合子路径：`@veltra/icons/normal`（205 个单色线性图标，`stroke="currentColor"`）与 `@veltra/icons/colorful`（13 个多色图标，保留源文件配色）；根入口 `@veltra/icons` 再导出两者合集与 `packageName` 常量。

## 快速上手

```vue
<script setup lang="ts">
// 图标从集合子路径按名称具名导入，导出名是 PascalCase 且没有 Icon 后缀
import { Search, Plus } from '@veltra/icons/normal'
import { Excel } from '@veltra/icons/colorful'
import { UIcon } from '@veltra/desktop'
</script>

<template>
  <!-- 推荐：放进 UIcon 获得 1em 尺寸约束（UIcon 详见 agent-docs/desktop/icon.md） -->
  <u-icon :size="16"><Search /></u-icon>

  <!-- 彩色图标：保留源文件配色，不受外部 color 影响 -->
  <u-icon :size="20"><Excel /></u-icon>

  <!-- 也可以不套 UIcon，直接在图标上写 SVG 属性 -->
  <Plus style="width: 16px; height: 16px" />
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、单色图标着色不生效。

## API 签名

每个图标在集合 barrel 里是一条具名导出（由 `bun run icons:gen` 生成，禁止手改）：

```ts
// @veltra/icons/normal（205 个导出，节选）
export { default as Search } from './vue/normal/search.vue'
export { default as CircleCheck } from './vue/normal/circle-check.vue'
export { default as FormInput } from './vue/normal/form-input.vue'

// @veltra/icons/colorful（13 个导出）
export { default as Archive } from './vue/colorful/archive.vue'
export { default as Excel } from './vue/colorful/excel.vue'

// 根入口 @veltra/icons：normal + colorful 全部图标 + 包名常量
export const packageName: '@veltra/icons'
export * from '@veltra/icons/normal'
export * from '@veltra/icons/colorful'
```

图标 SFC 本体是无 props 的模板组件：`<script setup>` 只有 `defineOptions({ name })`，`<template>` 是裸 `<svg>`。单色图标带 `fill="none" stroke="currentColor"`，彩色图标带源文件的 `fill="#..."`；两类 `<svg>` 都没有 `width`/`height` 属性，`viewBox` 由源文件决定（normal 为 `0 0 24 24`，colorful 为 `0 0 16 16`）。

导出名与内部组件名不同：`defineOptions({ name })` 在导出名与 HTML/Vue 保留名冲突时加 `U` 前缀（`Search` → 内部名 `USearch`），具名导出不变。

## 参数说明

图标组件没有 props 与事件，用法由导入方式与 CSS 决定：

| 用法 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 导入路径 | `'@veltra/icons/normal'` \| `'@veltra/icons/colorful'` \| `'@veltra/icons'` | — | 是 | 单色图标从 `normal` 导入，多色图标从 `colorful` 导入；仅需要 `packageName` 常量时才用根入口 |
| 导出名 | PascalCase | — | 是 | 由 kebab 文件名按 `-` 分段、每段首字母大写推导（`circle-check-filled` → `CircleCheckFilled`）；无 `Icon` 后缀 |
| 尺寸 | 容器 `font-size` 或 SVG `width`/`height` 属性 | `1em`（UIcon 内） | 否 | `<svg>` 无宽高；放 `UIcon` 即得 `1em × 1em` 约束，脱离 `UIcon` 必须自带尺寸 |
| 颜色 | CSS `currentColor` | `currentColor` | 否 | 仅 `normal` 集合跟随父级 `color`；`colorful` 集合固定源文件配色，任何外部 `color` 无效 |

## 典型示例

### 配合 UIcon 与颜色继承

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Search, Loading } from '@veltra/icons/normal'
</script>

<template>
  <!-- 单色图标颜色跟随父级 color（currentColor 机制） -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="16"><Search /></u-icon>
  </div>

  <!-- 加载动画：给 UIcon 加 is-loading 类 -->
  <u-icon :size="16" class="is-loading"><Loading /></u-icon>
</template>
```

### 图标清单检索与动态渲染

下游禁止扫本地 SVG 文件，按导出名或 kebab 名检索。TypeScript 自动补全：在 `import { } from '@veltra/icons/normal'` 中输入前缀（`Search`、`Arrow`、`Form`）枚举候选；程序化检索用命名空间导入：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import * as NormalIcons from '@veltra/icons/normal'
import { UIcon } from '@veltra/desktop'

const query = 'arrow'

// PascalCase 转回 kebab 再匹配（与 playground 图标库同一套算法）
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

const matched = computed(() =>
  Object.entries(NormalIcons as Record<string, Component>)
    .filter(([key, value]) => {
      if (key === 'default' || key.startsWith('_')) return false
      if (typeof value !== 'object' || value === null) return false
      return pascalToKebab(key).includes(query)
    })
    .map(([key, component]) => ({ name: key, component })),
)

// => [{ name: 'ArrowDown', component: ... }, ...]
</script>

<template>
  <u-icon v-for="item in matched" :key="item.name" :size="18">
    <component :is="item.component" />
  </u-icon>
</template>
```

检索关键词用英文语义（`search`、`arrow-left`、`excel`）；新增图标后以 `bun run icons:gen` 重新生成的 barrel 为准，禁止手改导出清单。

## 注意事项

> [!WARNING]
> - 导出名没有 `Icon` 后缀：写 `Search`，不是 `SearchIcon`；也不是 Element Plus 式 `<el-icon><Search /></el-icon>` 以外的字符串名称用法（本库没有 `<u-icon name="search">`，图标组件必须导入后放进 `UIcon` 默认插槽）。
> - `input`、`select`、`table` 等与 HTML 标签同名的表单控件图标统一改为 `Form*` 前缀：`FormInput`、`FormSelect`、`FormTable`、`FormTextarea`，根表单容器图标是 `FormContainer`；不要猜 HTML 标签同名导出。
> - `FontColor` 在 `normal` 与 `colorful` 两个集合各有一个（线性版与彩色版）；根入口 `export *` 遇到同名冲突时会丢弃重复导出，从根 `@veltra/icons` 导入 `FontColor` 得到 `undefined`。需要 `FontColor` 必须从子路径导入。
> - `colorful` 图标不受 `UIcon` 或外部 `color` 影响，固定源文件配色；需要跟随主题色时改用 `normal` 集合。
> - 禁止 `import * as Icons from '@veltra/icons'` 后全量注册：根入口包含全部 218 个图标，按需场景必须从子路径按名称导入。
> - 图标清单以 barrel 导出为准（`packages/icons/src/normal.ts`、`colorful.ts`），新增/删除图标后必须重跑 `bun run icons:gen`。

## 常见问题

### 导出 `FontColor` 报错 `does not provide an export named 'FontColor'`

原因：`FontColor` 在两个集合中重名，根入口 `@veltra/icons` 的 `export *` 丢弃了冲突导出。修复：从子路径导入并指明集合：

```ts
// 根入口没有 FontColor
// import { FontColor } from '@veltra/icons'           // undefined
import { FontColor } from '@veltra/icons/normal' // 线性版
import { FontColor as ColorfulFontColor } from '@veltra/icons/colorful' // 彩色版
```

### 想找某个图标但不确定导出名

命名规则：kebab 文件名按 `-` 分段、每段首字母大写。常用推导示例：

| kebab 文件名 | 导出名 | 集合 |
| --- | --- | --- |
| `circle-check-filled` | `CircleCheckFilled` | `normal` |
| `d-arrow-left` | `DArrowLeft` | `normal` |
| `form-input` | `FormInput` | `normal` |
| `unknown-file` | `UnknownFile` | `colorful` |

完整清单用 TypeScript 自动补全枚举：编辑器里在 `import { } from '@veltra/icons/normal'` 花括号内输入前缀即可列出全部候选；或用上文「图标清单检索与动态渲染」示例做程序化检索。

### 图标不显示颜色

单色图标颜色来自 CSS `currentColor`：必须给 `UIcon` 或其父元素设置 `color`。修复：

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Star } from '@veltra/icons/normal'
</script>

<template>
  <!-- 正确：父级设置 color -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="16"><Star /></u-icon>
  </div>
</template>
```

`colorful` 图标不适用本条；页面整体无颜色时先检查应用入口是否调用了 `loadTheme()`（见 `agent-docs/styles/theme.md`）。
