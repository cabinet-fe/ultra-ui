---
title: "@veltra/styles SCSS mixin 与基础样式子路径"
description: "pkg:@veltra/styles 的 mixins、vars、functions 用法，以及 normalize / transitions / animations 入口"
---

`@veltra/styles` 的 SCSS 与基础 CSS 走子路径，不按单个 mixin 或单个动画拆文档。组件样式用 `pkg:` 协议引用 mixins / vars / functions；normalize、过渡、动画用 JS `import`。

## Sass：mixins / vars / functions

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/vars';
@use 'pkg:@veltra/styles/functions' as fn;
```

`pkg:` 需要在 Vite 的 Sass 配置里启用 `NodePackageImporter`。下游项目一般直接 `new NodePackageImporter()`；本仓库 playground 因要从 monorepo 根解析 workspace 包，传入仓库根路径：

```ts
import { NodePackageImporter } from 'sass-embedded'

export default {
  css: {
    preprocessorOptions: {
      scss: { importers: [new NodePackageImporter()] }
    }
  }
}
```

### BEM（默认命名空间 `u`）

```scss
@include m.b(button) {
  @include m.e(icon) {
  }
  @include m.m(primary) {
  }
  @include m.is(disabled) {
  }
}
```

| mixin | 编译结果 |
| --- | --- |
| `m.b(button)` | `.u-button` |
| `m.e(icon)` | `&__icon` |
| `m.m(primary)` | `&--primary` |
| `m.em(icon, left)` | `&__icon--left` |
| `m.bem(button, icon, left)` | `.u-button__icon--left` |
| `m.is(disabled)` | `&.is-disabled` |
| `m.is-not(disabled, readonly)` | `&:not(.is-disabled):not(.is-readonly)` |

`m.b` / `m.e` / `m.m` / `m.is` 都接受多个参数，会拼成选择器列表。

### token 函数

```scss
.box {
  color: fn.use-var(text-color, main);
  background: fn.use-var(bg-color, top);
  border: fn.use-var(border);
  box-shadow: fn.use-var(shadow);
  background: fn.color-a(color, 8, primary);
  height: fn.component-var(button, height, 32px);
}
```

`vars` 提供与全局 CSS 变量对齐的别名，以及 `$sizes`（`small` / `default` / `large`）、`$color-types`（`primary` … `default`）。例如 `$color-primary`、`$text-color-main`、`$bg-color-top`。

### 尺寸、暗色、断点

```scss
@include m.size using ($size) {
  height: fn.use-var(form-component-height, $size);
}

@include m.dark {
  // 仅 html[data-theme='dark'] 下生效；优先改 token，少用这条
  background: fn.use-var(bg-color, bottom);
}

@include m.md {
  width: 100%;
}
```

断点 mixin：`xs` / `sm` / `md` / `lg` / `xl`，媒体查询宽度取 `--u-breakpoint-*`。另有 `m.flex`、`m.ellipsis`、`m.css-var` 等布局与变量辅助，按需 `@include`，不必单独成页。

### 自定义命名空间

默认 `$namespace: 'u'`。用 `@forward ... with` 覆盖后，BEM 类名和 CSS 变量前缀一起变：

```scss
// 应用自己的 _mixins.scss
@forward 'pkg:@veltra/styles/mixins' with (
  $namespace: 'my-app'
);
```

`m.b(button)` 仍是 `.u-button`；转发后的 mixin 编成 `.my-app-button`。

## normalize

应用入口导入一次：

```ts
import '@veltra/styles/normalize'
```

会 reset 常见元素，并用主题 token 设置 `html` 字体、字色；`html.small` / `html.default` / `html.large` 对应三档正文字号（由 `loadTheme` 根据 `useConfig` 的 `size` 加 class）。

## transitions

入口一次导入全部，或按文件按需导入：

```ts
import '@veltra/styles/transitions'
import '@veltra/styles/transitions/fade.scss'
```

配合 Vue `<Transition :name="...">`：

```vue
<Transition name="fade" mode="out-in">
  <div v-if="visible">...</div>
</Transition>
```

| name | 用途 |
| --- | --- |
| `fade` | 淡入淡出 |
| `fade-scale` | 淡入 + 缩放（Dialog 默认） |
| `slide-down` / `slide-up` | 垂直滑入 |
| `spring` | 弹性缩放 |
| `zoom-in` | 中心缩放 |
| `zoom-in-left` / `zoom-in-right` | 水平方向缩放 |
| `zoom-in-top` / `zoom-in-bottom` | 垂直方向缩放 |

对应源文件在 `@veltra/styles/transitions/*.scss`（`fade`、`fade-scale`、`slide`、`spring`、`zoom-in`）。

## animations

全局工具类，入口或按文件导入：

```ts
import '@veltra/styles/animations'
import '@veltra/styles/animations/shine.scss'
```

| 类名 | 用途 |
| --- | --- |
| `u-shine` | 文字扫光（`background-clip: text`）；`--u-shine-duration` 覆盖时长，默认 `2.4s`；`prefers-reduced-motion` 时停动画并恢复 `currentColor` |

```vue
<span class="u-shine">工作中…</span>
```
