---
title: UIcon 图标
description: "@veltra/desktop 导出的图标容器组件。把 @veltra/icons 的 SVG 图标组件放进默认插槽渲染，size 控制尺寸（数字自动补 px），颜色经 currentColor 继承父级，加 is-loading 类可显示旋转加载动画。"
aliases: [UIcon, Icon, 图标, 图标容器, SvgIcon]
keywords: [IconProps, size, is-loading, currentColor, "@veltra/icons", "@veltra/icons/normal", "@veltra/icons/colorful", SVG, 图标尺寸, 颜色继承, 加载动画, 旋转, 内联图标, 按钮图标]
---

# UIcon 图标

`@veltra/desktop` 导出图标容器 `UIcon`。`@veltra/icons` 包里的图标是渲染裸 `<svg>` 的 Vue SFC，本身不带尺寸样式；`UIcon` 用一个 `1em × 1em` 的行内容器包裹它们，`size` 写入 `font-size` 控制大小，颜色经 `currentColor` 继承父级 `color`。

## 快速上手

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
</script>

<template>
  <u-icon :size="18">
    <Search />
  </u-icon>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、图标颜色不生效。

### 与 @veltra/icons 的关系

- 图标从 `@veltra/icons/normal`（单色线性，`stroke="currentColor"`）或 `@veltra/icons/colorful`（多色）按名称具名导入，例如 `import { Search, Close } from '@veltra/icons/normal'`。
- 图标导出名是 PascalCase 且**没有 `Icon` 后缀**（写 `Search`，不写 `SearchIcon`）；内部组件名带 `U` 前缀（`USearch`），但具名导出仍是 `Search`。
- 图标 SFC 的 `<svg>` 不带 `width`/`height` 属性，尺寸完全由容器决定：放进 `UIcon` 即获得 `1em` 约束；脱离 `UIcon` 直接使用时尺寸不可控。
- 单色图标的颜色由 CSS `currentColor` 决定：给 `UIcon` 或其父元素设 `color` 即可着色。`UIcon` 没有 `color` 属性。
- 完整图标清单与命名规则见 `agent-docs/icons.md`。

## API 签名

```ts
/** 图标组件属性 */
export interface IconProps {
  /** 尺寸，写入 font-size；数字自动追加 px */
  size?: `${number}px` | number
}

export interface IconEmits {}

/** 图标组件暴露的对象 */
export interface IconExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `size` | `` `${number}px` `` \| `number` | — | 否 | 由 `withUnit(size, 'px')` 处理：`number` 与纯数字字符串追加 `px`（`:size="16"` 等价 `size="16px"`）；非纯数字字符串原样写入 `font-size`。未传时 `font-size: inherit`，跟随父级字号 |

插槽：默认插槽放 `@veltra/icons` 导出的图标组件。事件：无。暴露：`IconExposed` 为空对象。

容器根元素为 `<i class="u-icon">`：`width`/`height`/`line-height` 均为 `1em`，`inline-flex` 居中，内部 `svg` 同样被约束为 `1em × 1em`。

## 方法与事件

无事件、无暴露方法。加载旋转动画用类名 `is-loading` 表达（选择器 `.u-icon.is-loading`，2s 线性无限旋转）：

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Loading } from '@veltra/icons/normal'
</script>

<template>
  <u-icon :size="16" class="is-loading">
    <Loading />
  </u-icon>
</template>
```

## 典型示例

### 颜色继承与多尺寸

```vue
<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Star, User } from '@veltra/icons/normal'
</script>

<template>
  <!-- 颜色跟随父级 color（currentColor） -->
  <div style="color: var(--u-color-primary)">
    <u-icon :size="16"><Star /></u-icon>
    <u-icon :size="24"><Star /></u-icon>
  </div>

  <!-- 字符串形式 '24px' 与数字等价 -->
  <u-icon size="24px"><User /></u-icon>
</template>
```

### 输入框后缀图标

```vue
<script setup lang="ts">
import { UIcon, UInput } from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
import { ref } from 'vue'

const keyword = ref('')
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索...">
    <template #suffix>
      <u-icon :size="18"><Search /></u-icon>
    </template>
  </u-input>
</template>
```

## 注意事项

> [!WARNING]
> - 本库是 `UIcon` 包裹图标组件的嵌套写法（`<u-icon><Search /></u-icon>`），不是 Element Plus 的 `<el-icon>` + `size` 属性传组件，也不是 `<u-icon name="search">` 的名称式用法。
> - 图标从 `@veltra/icons/normal` / `@veltra/icons/colorful` 子路径导入；根入口 `@veltra/icons` 会导出全部图标，体积更大，按需场景禁止使用。
> - `size` 只控制大小，不控制颜色；着色必须给容器或父元素设 `color`。
> - 加载动画类名是 `is-loading`；写成 `u-icon--loading` 不会触发旋转。
