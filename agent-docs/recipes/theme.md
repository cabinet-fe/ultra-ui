---
title: Ultra UI 主题定制场景
description: 端到端完成 Ultra UI 主题定制：loadTheme 预设主题切换、深浅色切换（series 硬规则）、品牌色覆盖（UITheme#new 派生）、侧栏 nav 外观（variant dark/light）与编译期 SCSS token 定制；模板组件交给 VeltraUIResolver 注入组件 import 与样式副作用，显式 import 的组件必须补 components/<目录>/style，漏写时渲染成裸样式。
aliases: [主题定制, 换肤, 暗色模式, 深浅色切换, 品牌色, Theme]
keywords: [loadTheme, lightTheme, darkTheme, UITheme, series, nav.variant, navSidebarTokens, cssVar, NodePackageImporter, pkg:@veltra/styles, 主题切换, 深色模式, 暗色模式, 品牌色覆盖, 侧栏外观, 换肤, VeltraUIResolver, components/button/style, 裸样式, 样式副作用]
---

# Ultra UI 主题定制场景

Ultra UI（`@veltra/*`）的颜色全部来自 `loadTheme()` 注入的 `--u-*` token。本方案覆盖五个子场景：预设主题切换、深浅色切换、品牌色覆盖、侧栏 nav 外观、编译期 SCSS token 定制。所有主题 API 从 `@veltra/styles/theme` 导入。

## 场景

- 何时用本方案：要更换整套视觉（预设或派生）、运行时切深浅色、改品牌主色、调侧栏外观，或在业务 SCSS 里引用主题 token。
- 何时不用：只装库跑通安装——改用 `guide/installation.md`；只查某个 `--u-*` token 的名字与默认值——改用 `styles/tokens.md`；SCSS mixin / 函数的完整清单——改用 `guide/scss.md`。

## 完整示例

构建配置 + 入口初始化 + 主题切换模块 + 消费 token 的业务组件：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

// VeltraUIResolver 重写模板编译产物里的 _resolveComponent("<组件名>")，注入组件 import 与样式副作用
export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })]
})
```

```ts
// src/main.ts —— 主题必须初始化，否则 --u-* 为空、组件无颜色
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'
import { brandTheme } from './theme'

loadTheme(brandTheme) // 不传参时应用 lightTheme

createApp(App).mount('#app')
```

```ts
// src/theme.ts —— 品牌色派生 + 深浅色切换 + 侧栏外观
import {
  currentTheme,
  darkTheme,
  lightTheme,
  loadTheme,
  navSidebarTokens,
  type ThemeSeries
} from '@veltra/styles/theme'

// 从浅色基座派生品牌主题；深合并，只写要覆盖的字段
export const brandTheme = lightTheme.new({
  color: { primary: '#ff6600' },
  // 侧栏要浅底：variant 必须同时设为 'light'，否则浅底配白字
  nav: { variant: 'light', 'bg-color': '#f1ede0' }
})

export function switchSeries(series: ThemeSeries): void {
  if (series === currentTheme.value?.series) return
  // 品牌色保持：从品牌主题再派生，显式指定目标系列
  const next =
    series === 'dark'
      ? brandTheme.new({ color: { primary: '#ff6600' } }, { series: 'dark' })
      : brandTheme
  loadTheme(next) // 运行时热替换，不刷新页面
}

// 整组侧栏 token 换成「当前系列 × dark 变体」的内置值
export function useDarkNav(): void {
  const base = currentTheme.value
  if (!base) return
  const nav: Record<string, string> = { variant: 'dark' }
  for (const [name, value] of Object.entries(navSidebarTokens(base.series, 'dark'))) {
    nav[name.replace(/^--u-nav-/, '')] = value // 去掉 --u-nav- 前缀即覆盖键
  }
  loadTheme(base.new({ nav }))
}
```

```vue
<!-- src/components/ThemeDemo.vue —— 业务代码消费 token，不硬编码颜色 -->
<script setup lang="ts">
import { cssVar } from '@veltra/styles/theme'
// 模板组件（u-button）交给 VeltraUIResolver，禁止再 import：显式 import 会让模板改用该绑定，组件 import 与样式副作用都不注入。

const titleColor = cssVar('text-color-title') // => 'var(--u-text-color-title)'
</script>

<template>
  <div :style="{ color: titleColor }">品牌主题标题</div>
  <u-button type="primary">主色按钮（#ff6600 系）</u-button>
</template>
```

```vue
<!-- src/App.vue —— 切换入口 -->
<script setup lang="ts">
import { useTemplateRef } from 'vue'
// 模板组件（u-button）交给 VeltraUIResolver，禁止再 import：显式 import 会让模板改用该绑定，组件 import 与样式副作用都不注入。
import { switchSeries } from './theme'
import ThemeDemo from './components/ThemeDemo.vue' // 本地组件不在 resolver 范围内，必须显式 import

const current = useTemplateRef<'light' | 'dark'>('current')
</script>

<template>
  <u-button @click="switchSeries(current === 'dark' ? 'light' : 'dark')">深浅切换</u-button>
  <theme-demo />
</template>
```

## 要点说明

- `loadTheme(theme?)`：同步、无返回值、不抛错；默认 `lightTheme`。重复调用以最后一次为准——这就是热替换：注入的声明块整体替换，颜色立即生效。SSR 必须在 `onMounted` 中调用。
- 预设主题 9 个，每个自带 `series`，不成对切换：light 系 `lightTheme` / `heroTheme` / `ancientTheme` / `sakuraTheme` / `oceanTheme`；dark 系 `darkTheme` / `glassTheme` / `midnightTheme` / `neonTheme`。切深色就是 `loadTheme(darkTheme)` 这类换主题动作。
- 深浅色硬规则：`series` 决定注入哪套组件级 token 并写 `html[data-theme]`（`'light'` 或 `'dark'`）。从浅色基主题派生深色必须显式 `new(customTheme, { series: 'dark' })`；不写时全局色变了，表格斑马纹、按钮 plain 等组件级 token 仍是浅色套。
- 品牌色覆盖：`lightTheme.new({ color: { primary: '#ff6600' } })` 派生新 `UITheme`，主色及全部色阶、alpha token 同步派生；空值（`''` / `null` / `undefined`）字段被剔除，`0` 保留；数字 token 自动补 `px`。派生继承基主题 `series`（`options.series` 可覆盖），不修改基主题。
- `nav.variant` 硬规则：`'dark'` 深底浅字 / `'light'` 浅底深字，默认 `'dark'`（浅色主题的默认侧栏也是深底）。只改 `'bg-color'` 不改 `variant` 不联动前景，浅底必须同时 `variant: 'light'`。`nav` 其余字符串键逐项覆盖同名 `--u-nav-*`（`'bg-color'` → `--u-nav-bg-color`）。整组换内置值用 `navSidebarTokens(series, variant)`。
- 编译期 SCSS token：SCSS 里用 `@use 'pkg:@veltra/styles/functions' as fn` 与 `@use 'pkg:@veltra/styles/mixins' as m`；`fn.use-var(text-color, main)` 编译成 `var(--u-text-color-main)`。前提是 vite.config 注册 `new NodePackageImporter()`（`import { NodePackageImporter } from 'sass-embedded'`），不注册报 `Can't find stylesheet to import`。token 值仍由运行时 `loadTheme()` 注入，编译期不依赖主题。
- 业务代码引用 token 用 `cssVar('text-color-title')`（返回 `var(--u-text-color-title)`）或直接写 `var(--u-*)`；禁止硬编码 `#hex`，否则暗色下颜色不跟随。
- 组件样式与显式 import 成对出现：`u-button` 写在模板里时由 `VeltraUIResolver` 注入组件 import 与样式副作用（`components/button/style`），`<script setup>` 里禁止写 `import { UButton } from '@veltra/desktop'`。resolver 只重写模板里没有同名绑定的 `_resolveComponent("<组件名>")` 调用；显式 import 的组件不再产生该调用，必须自己补样式子路径：

  ```ts
  import { h } from 'vue'
  import { UButton } from '@veltra/desktop'
  import '@veltra/desktop/components/button/style' // 漏写：class 是 u-button 但 .u-button 规则不加载

  const themeSwitch = () => h(UButton, { type: 'primary' }, () => '深浅切换')
  ```

  `h()` / `render` 函数里的组件不经过模板编译，resolver 永不解析，必须显式 import；漏写时运行时报 `ReferenceError: UButton is not defined`。样式 API（`loadTheme` / `cssVar` / `navSidebarTokens`）不在组件表内，从 `@veltra/styles/theme` 显式 import 后不需要补样式子路径。

## 注意事项

> [!WARNING]
> - 本库的深浅色切换是「换一个带目标 `series` 的主题」，不是给 `html` 加 `dark` class；禁止在组件里写 `[data-theme]` 分支来配色。
> - 入口必须调用 `loadTheme()`：不调用时 `--u-*` 变量为空，组件没有颜色，且没有兜底值。
> - 主题 API 一律从 `@veltra/styles/theme` 导入；`@veltra/compositions` 不 re-export 主题。
> - 预设及其派生主题 `reactive` 为 `false`：运行中直接改 `theme.xxx` 不会自动重渲染，改完字段必须再调一次 `loadTheme(theme)`；需要响应式主题时用 `new UITheme(theme)`（默认 `reactive: true`）。
> - `pkg:` 前缀必须写：`@use '@veltra/styles/mixins'`（不带 `pkg:`）报 `Can't find stylesheet to import`。
> - 非 hex 颜色（如 glassTheme 的 `rgba()` 背景）不生成对应 alpha / 混合派生 token。
> - `mixColor(color1, color2, ratio)` 的 `ratio > 1` 时抛 `Error('ratio的值在0-1之间')`。
> - 显式 import 的组件必须补 `import '@veltra/desktop/components/<目录>/style'`：resolver 只处理模板里没有同名绑定的组件，写了 `import { UButton } from '@veltra/desktop'` 就必须写 `import '@veltra/desktop/components/button/style'`，否则模板结构正确但渲染成裸样式。`h()` / `render` 里的组件永不被 resolver 解析，必须显式 import，漏写报 `ReferenceError: UTag is not defined`。
