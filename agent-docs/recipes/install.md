---
title: 组件库安装配置、工程接入与组件按需自动导入
description: Ultra UI (@veltra/*) 在 Vue 3 项目中的完整安装、全局样式与主题初始化（loadTheme）及组件注册指南，详解基于 unplugin-vue-components 的 VeltraUIResolver 按需自动导入与样式副作用引入
---

在宿主 Vue 3 应用中接入 Ultra UI：先装包并在入口注入样式与主题，再选择一种组件注册方式。漏掉 `loadTheme()` 时组件会渲染成无色的裸 HTML——颜色全部走 `--u-*` token，且只由 `loadTheme()` 在运行时注入，没有兜底值。

## 安装

```bash
bun add @veltra/desktop
```

`@veltra/desktop` 的 peer 包含 `vue`、`@veltra/styles`、`@veltra/utils`、`@veltra/compositions`、`@veltra/directives`、`@veltra/icons`。使用 AI 对话或电子表格时再装对应包：

```bash
bun add @veltra/ai @veltra/sheet @veltra/sheet-core
```

按需自动导入时把解析器装到开发依赖：

```bash
bun add -D @veltra/vite unplugin-vue-components
```

## 入口必须做的两件事

无论下面用哪种注册方式，`main.ts` 都必须：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()

const app = createApp(App)
app.mount('#app')
```

- `@veltra/styles/normalize`：全局 reset，入口导入一次。
- `loadTheme()`：注入默认浅色主题 token，并把 `html[data-theme]` 置为 `'light'`。SSR 请在 `onMounted` 里调用。换主题见主题配方。

组件看起来透明、没有主题色时，先补 `loadTheme()`，不要用手写 CSS 去补颜色。

## 组件注册（三选一）

### 1. 全局注册 `app.use(UltraUI)`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'
import UltraUI from '@veltra/desktop/install'

loadTheme()

const app = createApp(App)
app.use(UltraUI)
app.mount('#app')
```

`UltraUI` 也可 named import：`import { UltraUI } from '@veltra/desktop/install'`。`@veltra/desktop` 根入口只导出组件、函数和类型，**没有**默认 plugin。

`app.use(UltraUI)` 会注册全部 `U*` 组件、指令（`v-ripple` / `v-click-outside` / `v-focus` / `v-loading`），并注入全量组件样式。主题 token 仍由 `loadTheme()` 负责。

### 2. Vite 自动导入 `VeltraUIResolver`

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({ plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })] })
```

模板里的 `<UButton>` / `<u-button>` 会在构建时按需注入组件与样式副作用。一个 resolver 同时覆盖 `@veltra/desktop`、`@veltra/ai`（`UAiChat` / `UAiOrb`）、`@veltra/sheet`（`USheet`）；未安装的可选 peer 不会出现在模板里，无需额外配置。

`VeltraUIResolver({ importStyle: false })` 可关掉样式副作用，改为入口手动 `import '@veltra/desktop/style'`。

指令与图标不在 resolver 范围内，需手动 import。主题 token 仍需入口 `loadTheme()`。

### 3. 手动 `import` + `style`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UInput } from '@veltra/desktop'
import { vRipple } from '@veltra/directives'
import '@veltra/desktop/components/button/style'
import '@veltra/desktop/components/input/style'

const value = ref('')
</script>

<template>
  <u-button type="primary" v-ripple>提交</u-button>
  <u-input v-model="value" placeholder="请输入" />
</template>
```

每个用到的组件都要同时导入对应 `style` 子路径（例如 `@veltra/desktop/components/button/style`）。若希望手动 import 组件但使用全量样式，可在入口写 `import '@veltra/desktop/style'`。

## 接入检查

- 入口已 `import '@veltra/styles/normalize'` 并调用 `loadTheme()`。
- 三种注册方式只选一种；模板里 `<u-xxx>` 变成未知标签，说明没注册。
- 不要用 div 仿造按钮、弹窗、空态、滚动容器。
