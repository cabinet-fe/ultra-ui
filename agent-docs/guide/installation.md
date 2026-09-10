---
title: Ultra UI 安装与初始化
description: 在 Vue 3 宿主应用中安装 @veltra/desktop 并完成入口初始化：normalize + loadTheme 主题注入、三种组件注册方式（app.use 全量、SFC 显式导入、VeltraUIResolver 按需自动导入）与 SCSS token 编译配置。
aliases: [install, 安装, 接入, "@veltra/desktop 安装", 组件库安装]
keywords: [bun add, loadTheme, "@veltra/styles/normalize", UltraUI, "@veltra/desktop/install", VeltraUIResolver, unplugin-vue-components, NodePackageImporter, sass-embedded, peerDependencies, 按需导入, 全局注册, 主题初始化, importStyle, --u-]
---

# Ultra UI 安装与初始化

Ultra UI 是 npm 作用域 `@veltra/*` 下的 Vue 3 组件与能力库。本指南完成：安装 `@veltra/desktop` 与 peer 依赖、入口初始化（normalize + `loadTheme()`）、选择一种组件注册方式、按需配置 SCSS token 编译，最后用 `UButton` 验证。适用 Vue `>=3.5.42`、Vite 构建、`@veltra/desktop@1.7.9`。

## 前置条件

- Node.js：`>=20`（`sass-embedded` 要求）。
- Vue：`>=3.5.42`（`@veltra/desktop` 的 peerDependencies 约束）。
- 包管理器：本文用 `bun`，`npm` / `pnpm` / `yarn` 命令等价替换。
- `@veltra/desktop` 的 peer 依赖必须由宿主安装（清单核自 `packages/desktop/package.json` 的 `peerDependencies`）：
  - `vue` `>=3.5.42`
  - `@cat-kit/core` `>=1.2.1`
  - `@cat-kit/fe` `>=1.2.1`
  - `@veltra/icons`
  - `@veltra/styles`
  - `@veltra/utils`
  - `@veltra/compositions`
  - `@veltra/directives`
  - `@veltra/sheet-core`（optional peer；仅使用 `USheet` 或模型操作时必须安装）
- 使用 AI 对话时安装 `@veltra/ai`；使用电子表格时安装 `@veltra/sheet`（`@veltra/sheet` 自身依赖 `@veltra/sheet-core`）。
- 走按需自动导入时，开发依赖需 `@veltra/vite` 与 `unplugin-vue-components`。

## 步骤

1. 安装组件包与 peer 依赖：

   ```bash
   bun add @veltra/desktop @veltra/styles @veltra/utils @veltra/compositions @veltra/directives @veltra/icons @cat-kit/core @cat-kit/fe
   ```

   按需加 AI 或电子表格：

   ```bash
   bun add @veltra/ai          # AI 对话：UAiChat / useChat
   bun add @veltra/sheet @veltra/sheet-core   # 电子表格：USheet + Workbook 模型
   ```

2. 初始化入口，写入 `src/main.ts`。`import '@veltra/styles/normalize'` 与 `loadTheme()` 必须在组件挂载前执行；不调用 `loadTheme()` 时 `html` 上没有任何 `--u-*` 变量，组件没有颜色：

   ```ts
   // src/main.ts
   import { createApp } from 'vue'
   import App from './App.vue'
   import '@veltra/styles/normalize'
   import { loadTheme } from '@veltra/styles/theme'

   loadTheme() // 不传参时应用 lightTheme，并写 html[data-theme="light"]

   const app = createApp(App)
   app.mount('#app')
   ```

3. 组件注册三选一（禁止混用两种注册同一组件）。

   方式一，全局注册 `app.use(UltraUI)`。`@veltra/desktop/install` 导出名为 `UltraUI` 的 Vue Plugin（default 与 named 均可导入），注册全部 `U*` 组件、指令（`v-ripple` / `v-click-outside` / `v-focus` / `v-loading`）并注入全量组件样式。`@veltra/desktop` 根入口只导出组件与类型，没有 default plugin：

   ```ts
   // src/main.ts（在步骤 2 基础上追加）
   import UltraUI from '@veltra/desktop/install'

   app.use(UltraUI)
   ```

   方式二，SFC 内显式 import。每个用到的组件都要同时导入对应 `style` 子路径，否则无样式：

   ```vue
   <!-- src/App.vue -->
   <script setup lang="ts">
   import { UButton } from '@veltra/desktop'
   import '@veltra/desktop/components/button/style'
   </script>

   <template>
     <u-button type="primary">提交</u-button>
   </template>
   ```

   方式三，`VeltraUIResolver` 按需自动导入。模板里的 `<u-xxx>` 在构建时注入组件与样式副作用，覆盖 `@veltra/desktop`、`@veltra/ai`（`UAiChat` / `UAiOrb`）、`@veltra/sheet`（`USheet`）。指令与图标不在 resolver 范围内，需手动 import。完整文档见 `vite/veltra-ui-resolver.md`，最小可运行配置如下：

   ```bash
   bun add -D @veltra/vite unplugin-vue-components
   ```

   ```ts
   // vite.config.ts
   import vue from '@vitejs/plugin-vue'
   import Components from 'unplugin-vue-components/vite'
   import { defineConfig } from 'vite'
   import { VeltraUIResolver } from '@veltra/vite'

   export default defineConfig({
     plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })]
   })
   ```

4. 仅当项目写 `<style lang="scss">` 且要用 `pkg:@veltra/styles/...` token 函数 / mixin 时配置。`NodePackageImporter` 从 `sass-embedded` 导入，不注册时 `pkg:` 导入报 `Can't find stylesheet to import`：

   ```ts
   // vite.config.ts
   import { NodePackageImporter } from 'sass-embedded'
   import { defineConfig } from 'vite'

   export default defineConfig({
     css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
   })
   ```

## 完整示例

步骤合并后的最终形态（方式三按需导入 + SCSS 配置），可直接复制：

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()

const app = createApp(App)
app.mount('#app')
```

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { UButton } from '@veltra/desktop'
</script>

<template>
  <u-button type="primary">提交</u-button>
</template>
```

## 验证

启动 dev server：

```bash
bun run dev
```

页面渲染出一个蓝色主色按钮，背景为 `--u-color-primary`，圆角、阴影生效。DevTools 里检查两项：

- `html` 元素带 `data-theme="light"` 属性，且 Styles 面板能看到 `--u-color-primary` 等 `--u-*` 变量（`loadTheme()` 已生效）。
- `<button>` 元素的 class 以 `u-button` 开头（组件已注册，不是未知标签）。

按钮无色、`html` 上查不到 `--u-*`：`main.ts` 缺 `loadTheme()`。`<u-button>` 原样出现在 DOM：注册方式没配对，检查 resolver 配置或改用显式 import。

## 注意事项

> [!WARNING]
> - 主题初始化是硬规则：`import '@veltra/styles/normalize'` + `loadTheme()` 必须写在入口，且在首次渲染前执行。组件颜色全部走 `--u-*` token，没有兜底值；SSR 时在 `onMounted` 中调用 `loadTheme()`。
> - 本库组件从 `@veltra/desktop` 导入（如 `import { UButton } from '@veltra/desktop'`），不是 `ultra-ui` 单包，也不是从 `@veltra/styles` 导入组件。
> - `@veltra/desktop/install` 才有 `UltraUI` plugin；从 `@veltra/desktop` 根入口 `import UltraUI` 会得到 `undefined`。
> - 三种注册方式只选一种。用 resolver 时不要对同一组件再手动 `app.use`；未走 resolver 时 `vLoading` 等指令必须从 `@veltra/desktop` 或 `@veltra/directives` 手动导入。
> - 显式 import 时样式子路径与组件成对出现：`import '@veltra/desktop/components/button/style'`；漏写则组件渲染正常但无样式。`VeltraUIResolver({ importStyle: false })` 时改由入口 `import '@veltra/desktop/style'` 引全量样式。
> - `pkg:@veltra/styles/...` SCSS 导入必须先注册 `NodePackageImporter`；monorepo 内引用 workspace 包时构造函数必须传仓库根：`new NodePackageImporter(repoRoot)`。
> - `@veltra/sheet-core` 是 `@veltra/desktop` 的 optional peer；不装也能跑，但 `USheet` 与 Workbook 模型操作需要它，此时必须安装。
