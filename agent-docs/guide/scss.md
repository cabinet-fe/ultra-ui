---
title: "@veltra/styles SCSS 用法指南"
description: "用 pkg:@veltra/styles 前缀在组件样式里引用 vars、functions、mixins：BEM mixin、主题 token 函数、暗色与断点 mixin 的完整清单，以及 sass-embedded NodePackageImporter 的注册与 entryPointDirectory 解析规则（磁盘 .scss 文件自动向上解析；additionalData 等非磁盘来源才需要传目录）。"
aliases: [scss, sass, mixins, BEM, 样式工具]
keywords: ["pkg:", NodePackageImporter, entryPointDirectory, additionalData, sass-embedded, "Can't find stylesheet to import", use-var, color-a, component-var, use-vars, css-var, bem, $namespace, ellipsis, is-not, 命名空间, 样式函数, 暗色样式, 响应式断点]
---

# @veltra/styles SCSS 用法指南

`@veltra/styles` 把 SCSS 工具（`_vars.scss`、`_functions.scss`、`_mixins.scss`）与各样式文件通过 package exports 的 `sass` 条件暴露，SCSS 里用 `@use 'pkg:@veltra/styles/...'` 导入。本指南覆盖构建配置、全部 mixin / 函数 / 变量清单与端到端示例。

## 前置条件

- 依赖 `@veltra/styles`；构建链使用 `sass-embedded`（本仓库锁 `1.104.0`）。`NodePackageImporter` 从 `sass-embedded` 导入。
- Vite（或其他打包器）的 Sass 预处理选项里注册 `NodePackageImporter`；不注册时 `pkg:` 导入报 `Can't find stylesheet to import`。磁盘 `.scss` 文件里的 `pkg:`（本库组件样式属此类）由 sass 从该文件所在目录逐级向上找 `node_modules`，`new NodePackageImporter()` 省略参数即可；只有 `additionalData` 等非磁盘来源才需要传 `entryPointDirectory`，且该目录的 `node_modules`（或其祖先）必须能解析到 `@veltra/styles`。
- 运行时主题：`fn.use-var()` 等函数编译期只生成 `var(--u-*)`，变量值由 `loadTheme()` 注入（见 `styles/theme.md`）。编译不依赖主题，运行时没主题则组件无颜色。

## 步骤

### 1. 配置 NodePackageImporter

`pkg:` 前缀只有 `NodePackageImporter` 认识；常规下游项目省略参数：

```ts
// vite.config.ts
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite'

export default defineConfig({
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

参数 `entryPointDirectory` 只对**非磁盘来源**的 `pkg:` URL 生效（`css.preprocessorOptions.scss.additionalData` 注入的字符串、把样式内容以字符串交给 sass 的插件）；省略参数时该目录取 Node 入口（dev 下的 vite 可执行文件）所在目录。磁盘上的 `.scss` 文件里写 `pkg:` 时，sass 从该文件所在目录逐级向上找 `node_modules`，与 `entryPointDirectory` 无关——本库组件样式（如 `packages/desktop/src/components/button/style.scss`）属于这一类，编译它时 `new NodePackageImporter()`、传仓库根、传其他目录都解析成功。

非磁盘来源要显式传目录时，必须传「其 `node_modules`（或其祖先）里能解析到 `@veltra/styles` 的目录」；传一个不含该链接的目录仍报 `Can't find stylesheet to import`。本仓库根目录没有 `node_modules/@veltra`（bun 把链接放在 `packages/<包>/node_modules/@veltra/` 与 `test/node_modules/@veltra/`），`test/vite.config.ts`、`playground/vite.config.ts` 传 `new NodePackageImporter(resolve(import.meta.dirname, '..'))` 是仓库自身写法，不代表任意目录都行：

```ts
// monorepo 的 additionalData 等非磁盘来源需要传目录时
import { resolve } from 'node:path'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite'

const repoRoot = resolve(import.meta.dirname, '..')

export default defineConfig({
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } }
})
```

### 2. 选择 @use 路径

exports 映射 `'./*'` 的 `sass` 条件指向 `./src/*`，partial 按下划线规则解析：

| @use 路径 | 源文件 | 内容 |
| --- | --- | --- |
| `pkg:@veltra/styles/vars` | `src/_vars.scss` | 语义别名变量、`$sizes`、`$color-types` |
| `pkg:@veltra/styles/functions` | `src/_functions.scss` | token 引用函数、BEM 函数 |
| `pkg:@veltra/styles/mixins` | `src/_mixins.scss` | BEM、布局、暗色、断点 mixin |

`src` 下任意样式文件同样可达（如 `pkg:@veltra/styles/animations/shine`），但动画 / 过渡的按需加载走 JS `import`，见 `styles/animations.md`。

约定别名：mixins 用 `as m`，functions 用 `as fn`，vars 不设别名。

### 3. 引用 token 函数（_functions.scss）

```scss
@use 'pkg:@veltra/styles/functions' as fn;

.box {
  color: fn.use-var(text-color, main); // var(--u-text-color-main)
  border: fn.use-var(border); // var(--u-border-color) var(--u-border-width) var(--u-border-style)
  background: fn.color-a(color, 8, primary); // var(--u-color-primary-a-8)
  height: fn.component-var(button, height, 32px); // var(--u-button-height, 32px)
  padding: fn.use-vars((gap-small, gap-default)); // var(--u-gap-small) var(--u-gap-default)
}
```

| 函数 | 签名 | 返回 |
| --- | --- | --- |
| `use-var` | `($basename, $nodes...)` | `var(--u-{$basename}-{$nodes...})`，全局 token |
| `use-vars` | `($vars, $separator: ' ')` | 多个 `use-var` 用分隔符拼接 |
| `color-a` | `($basename, $alpha, $nodes...)` | `var(--u-{$basename}-{$nodes...}-a-{$alpha})`，alpha token |
| `component-var` | `($component, $property, $fallback: null)` | `var(--u-{$component}-{$property}[, $fallback])` |
| `bem` | `($b, $e: null, $m: null)` | 选择器字符串 `.u-b__e--m`（函数版，用于插值） |

### 4. 使用 BEM 与工具 mixin（_mixins.scss）

```scss
@use 'pkg:@veltra/styles/mixins' as m;

@include m.b(button) {
  @include m.e(icon) {
    margin-right: 4px; // .u-button__icon
  }
  @include m.m(primary) {
    background: red; // .u-button--primary
  }
  @include m.em(icon, left) {
    order: -1; // .u-button__icon--left
  }
  @include m.is(disabled) {
    opacity: 0.5; // .u-button.is-disabled
  }
  @include m.is-not(disabled, readonly) {
    &:hover {
      border-color: blue; // .u-button:not(.is-disabled):not(.is-readonly):hover
    }
  }
}
```

| mixin | 签名 | 编译结果 |
| --- | --- | --- |
| `b` | `($blocks...)` | 每个 block 一条 `.u-{$block} { ... }` |
| `e` | `($elements...)` | `&__el1, &__el2` 选择器列表 |
| `m` | `($modifiers...)` | `&--mod1, &--mod2` 选择器列表 |
| `em` | `($element, $modifier)` | `&__el--mod` |
| `bem` | `($b, $e: null, $m: null)` | `.u-b__e--m` 完整选择器 |
| `is` | `($types...)` | `&.is-type` |
| `is-not` | `($types...)` | `&:not(.is-a):not(.is-b)` 链式否定 |
| `flex` | `($display: flex, $justify: flex-start, $align: center, $wrap: nowrap)` | 四条 flex 属性 |
| `ellipsis` | 无参数 | overflow / text-overflow / white-space 三件套 |
| `size` | 无参数，配 `using ($size)` | 生成 `&--small` / `&--default` / `&--large` |
| `css-var` | `($prefix, $list)` | map 或 list 展开为一组 `--{$prefix}-key: value` 声明 |
| `dark` | 无参数 | 包一层 `html[data-theme='dark'] &` |
| `xs` / `sm` / `md` / `lg` / `xl` | 无参数 | 媒体查询，宽度边界取 `--u-breakpoint-*` |

`size` 与 `css-var` 用法：

```scss
@use 'sass:map';
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

$heights: (small: 24px, default: 32px, large: 40px);

.u-input {
  @include m.size using ($size) {
    height: map.get($heights, $size); // .u-input--small / --default / --large

    @include m.dark {
      background: fn.use-var(bg-color, bottom); // 仅 html[data-theme='dark'] 下生效
    }
  }
}

.field {
  @include m.css-var(height, (large: 40px, default: 32px, small: 24px));
  // => --height-large: 40px; --height-default: 32px; --height-small: 24px;
}
```

### 5. 引用变量（_vars.scss）

| 变量 | 值 |
| --- | --- |
| `$color-primary` | `var(--u-color-primary)` |
| `$text-color-main` | `var(--u-text-color-main)` |
| `$border-color` | `var(--u-border-color)` |
| `$border-muted-color` | `var(--u-border-muted-color)` |
| `$bg-color-top` | `var(--u-bg-color-top)` |
| `$sizes` | `(small, default, large)` |
| `$color-types` | `(primary, success, warning, danger, info, disabled, default)` |

### 6. 自定义命名空间（可选）

`functions` 与 `mixins` 各自声明 `$namespace: 'u' !default`。用 `@forward ... with` 覆盖后 BEM 类名与变量前缀一起变：

```scss
// 应用自己的 _mixins.scss
@forward 'pkg:@veltra/styles/mixins' with ($namespace: 'my-app');
@forward 'pkg:@veltra/styles/functions' with ($namespace: 'my-app');
```

之后业务样式 `@use` 这份转发文件；`m.b(button)` 编成 `.my-app-button`。

## 完整示例

```ts
// vite.config.ts
import { NodePackageImporter } from 'sass-embedded'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

```ts
// src/main.ts —— 主题前置：SCSS 生成的 var(--u-*) 值由这里注入
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

```vue
<!-- src/components/PayCard.vue -->
<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="u-pay-card" :class="{ 'is-active': true }">
    <span class="u-pay-card__title">{{ title }}</span>
  </div>
</template>

<style lang="scss">
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(pay-card) {
  display: flex;
  background: fn.use-var(bg-color, top);
  border-radius: fn.use-var(radius, default);
  box-shadow: fn.use-var(shadow, sm);
  transition: box-shadow fn.use-var(transition, normal) fn.use-var(transition, ease);

  @include m.e(title) {
    color: fn.use-var(text-color, title);
  }

  @include m.is(active) {
    background: fn.color-a(color, 8, primary);
  }

  @include m.sm {
    flex-direction: column; // 960px 以下纵排
  }
}
</style>
```

## 验证

```bash
npx vite build
```

构建通过，且产物 CSS 中出现：

```css
.u-pay-card {
  background: var(--u-bg-color-top);
  border-radius: var(--u-radius-default);
  box-shadow: var(--u-shadow-sm);
}
.u-pay-card__title {
  color: var(--u-text-color-title);
}
.u-pay-card.is-active {
  background: var(--u-color-primary-a-8);
}
@media screen and (min-width: var(--u-breakpoint-xs)) and (max-width: var(--u-breakpoint-sm)) {
  .u-pay-card {
    flex-direction: column;
  }
}
```

浏览器里打开页面，`html` 元素上应能查到 `--u-bg-color-top` 等变量（`loadTheme()` 已调用）。

## 注意事项

> [!WARNING]
> - `pkg:` 前缀必须写：`NodePackageImporter` 只解析 `pkg:` 开头的导入，写 `@use '@veltra/styles/mixins'` 会报 `Can't find stylesheet to import`。
> - SCSS 构建必须注册 `NodePackageImporter`；磁盘 `.scss` 文件里的 `pkg:` 由 sass 从该文件目录逐级向上解析，`new NodePackageImporter()` 省略参数即可。只有 `additionalData` 等非磁盘来源才需要传 `entryPointDirectory`，且必须传「其 `node_modules`（或其祖先）里能解析到 `@veltra/styles` 的目录」——本仓库根目录没有 `node_modules/@veltra`，`test/vite.config.ts`、`playground/vite.config.ts` 传仓库根是仓库自身写法，不代表任意目录都行。
> - `vars` 里的语义别名硬编码 `--u-`，不随 `$namespace` 配置变；改命名空间时组件库自身的类名体系不会跟着改，只有你自己的 `m.b()` 输出变。
> - `functions` 与 `mixins` 的 `$namespace` 相互独立，要一起改必须分别 `@forward ... with`。
> - `fn.dark` / `m.dark` 基于 `html[data-theme='dark']`，前提是已 `loadTheme` 过深色系列主题；覆盖不了的暗色差异优先改 token 而不是加分支。
> - 断点 mixin 的媒体查询边界是 `var(--u-breakpoint-*)`；若目标环境不支持 `@media` 中的 `var()`，改用固定值自行处理。
> - token 函数编译期只生成 `var()` 引用；禁止在 SCSS 里硬编码 `#hex` 代替 `fn.use-var`，否则暗色主题下颜色不跟随。
