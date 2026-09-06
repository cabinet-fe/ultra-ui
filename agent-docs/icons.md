---
title: "@veltra/icons - 图标库导入、PascalCase/kebab 命名与按需检索"
description: "Vue 3 矢量图标库使用指南：从 @veltra/icons/normal（线性与单色图标）及 colorful（多色多彩图标）子路径按需导入 Vue SFC 图标组件，配合 UIcon 组件渲染并支持 PascalCase 与 kebab-case 规范检索"
keywords: ["@veltra/icons", "icons", "normal", "colorful", "UIcon", "图标"]
aliases: ["icons", "veltra-icons", "图标库"]
---
## 快速上手

`@veltra/icons` 把 SVG 编成可 tree-shake 的 Vue SFC。分两个集合子路径，按名称具名导出；不要一图标一篇文档，清单以 `@veltra/icons/normal` 与 `@veltra/icons/colorful` 的具名导出为准。

优先子路径，便于按集合拆包：

```ts
import { Search, Close, Plus } from '@veltra/icons/normal'
import { Excel, Pdf, FontColor } from '@veltra/icons/colorful'
```

根入口 `@veltra/icons` 会把 normal + colorful 全部再导出（体积更大），并带 `packageName` 常量。业务按集合导入即可。

图标名**没有 `Icon` 后缀**：写 `Plus`，不要写 `PlusIcon`。

## 参数说明

图标源文件按集合区分（normal / colorful），basename 为 ASCII kebab-case（如 `circle-check.vue`）。导出名是 PascalCase：

| kebab 文件名 | 导出名 |
| --- | --- |
| `search` | `Search` |
| `circle-check` | `CircleCheck` |
| `circle-check-filled` | `CircleCheckFilled` |
| `d-arrow-left` | `DArrowLeft` |
| `form-input` | `FormInput` |

规则：按 `-` 分段后每段首字母大写。分类由目录表达，文件名不要再加 `normal-` / `colorful-` 前缀。语义顺序优先「对象-状态」，如 `circle-check-filled`。

表单设计器类图标统一 `form-*` → `Form*`（如 `form-input` → `FormInput`，根表单容器是 `FormContainer`）。完整导出名看对应 barrel，不要猜 HTML 标签同名（`input` 已改成 `FormInput`）。

少数导出名与 HTML/Vue 保留名冲突时，SFC 的 `defineOptions({ name })` 会加 `U` 前缀（如内部名 `USearch`），**具名导出仍是 `Search`**。

## 典型示例

下游不要扫本地 SVG，按导出名或 kebab 搜：

1. TypeScript 自动完成：`import { } from '@veltra/icons/normal'` 打前缀（`Search`、`Arrow`、`Form`）。
2. 把 PascalCase 转回 kebab 再包含匹配（playground 图标库同一套算法）：

```ts
import * as NormalIcons from '@veltra/icons/normal'
import * as ColorfulIcons from '@veltra/icons/colorful'
import type { Component } from 'vue'

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function findIcons(ns: Record<string, unknown>, query: string) {
  const q = query.trim().toLowerCase()
  return Object.entries(ns)
    .filter(([key, value]) => {
      if (key === 'default' || key.startsWith('_')) return false
      if (typeof value !== 'object' || value === null) return false
      if (!q) return true
      const kebab = pascalToKebab(key)
      return kebab.includes(q) || key.toLowerCase().includes(q)
    })
    .map(([key, value]) => ({
      pascal: key,
      kebab: pascalToKebab(key),
      component: value as Component
    }))
}

findIcons(NormalIcons as Record<string, unknown>, 'search')
findIcons(ColorfulIcons as Record<string, unknown>, 'pdf')
```

检索关键词用英文语义（`search`、`arrow-left`、`excel`），不要用中文文件名。新增图标后以 `@veltra/icons` 包内重新生成的 barrel 导出为准，不要手改导出清单。

检索示例：

| 想找 | 集合 | 导入 |
| --- | --- | --- |
| 搜索、关闭、加减 | `normal` | `Search` `Close` `Plus` `Minus` |
| 勾选 / 圆标状态 | `normal` | `Check` `CircleCheck` `CircleClose` |
| 箭头 | `normal` | `ArrowLeft` `CaretTop` `DArrowRight` |
| 表单控件示意 | `normal` | `FormInput` `FormSelect` `FormDatePicker` |
| 文档类型 | `colorful` | `Excel` `Pdf` `Word` `UnknownFile` |

## 与 UIcon 配合

单色图标一般套 `@veltra/desktop` 的 `UIcon`。`UIcon` 只有 `size`（`number` 或 `` `${number}px` ``），颜色走 `currentColor`（父元素 `color` 或 CSS `color`），没有 `color` prop。

```vue
<script setup lang="ts">
import { Search } from '@veltra/icons/normal'
</script>

<template>
  <div style="color: var(--u-color-primary)">
    <u-icon :size="16">
      <Search />
    </u-icon>
  </div>
</template>
```

动态组件：

```vue
<u-icon :size="20">
  <component :is="icon" />
</u-icon>
```

加载转圈给 `UIcon` 加 class `is-loading`（选择器 `.u-icon.is-loading`）。

## 注意事项

- **normal**：单色 SVG，`fill: currentColor`，跟随 `UIcon` / 父级颜色。
- **colorful**：多色，保留源文件配色，**不受** `UIcon` 或外部 `color` 影响。当前导出：`Archive`、`Excel`、`Fold`、`FontColor`、`Image`、`MiddleGround`、`Pdf`、`PowerPoint`、`Title`、`Txt`、`UnknownFile`、`Video`、`Word`。
