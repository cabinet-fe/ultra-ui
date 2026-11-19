---
title: Ultra UI 安装与初始化
description: 在 Vue 3 宿主应用中安装 @veltra/desktop 并完成入口初始化：normalize + loadTheme 主题注入、两种组件注册方式（app.use 全量、SFC/TSX 显式导入，样式随组件模块自动按需加载）与渲染函数使用规则，以及 TSX 的 @vitejs/plugin-vue-jsx 与 SCSS NodePackageImporter 构建配置。
aliases: [install, 安装, 接入, '@veltra/desktop 安装', 组件库安装, '@veltra/vite 废弃迁移']
keywords:
  [
    bun add,
    loadTheme,
    '@veltra/styles/normalize',
    UltraUI,
    '@veltra/desktop/install',
    '@vitejs/plugin-vue-jsx',
    react/jsx-dev-runtime,
    react/jsx-runtime,
    tsx,
    JSX,
    渲染函数,
    NodePackageImporter,
    sass-embedded,
    peerDependencies,
    按需导入,
    样式跟随,
    tree-shaking,
    sideEffects,
    全局注册,
    主题初始化,
    --u-
  ]
---

# Ultra UI 安装与初始化

Ultra UI 是 npm 作用域 `@veltra/*` 下的 Vue 3 组件与能力库。本指南完成：安装 `@veltra/desktop` 与 peer 依赖、入口初始化（normalize + `loadTheme()`）、选择一种组件注册方式、按需配置 SCSS token 编译，最后用 `UButton` 验证。适用 Vue `>=3.5.43`、Vite 构建、`@veltra/desktop@2.3.0`。

组件样式不是独立入口：每个组件 SFC 模块自带样式副作用导入（`sideEffects` 白名单内的 `style.ts`），宿主 `import { UButton } from '@veltra/desktop'` 即同时获得组件 JS 与样式，未用到的组件与样式同粒度被 tree-shake 摇掉。函数式 API（`message` / `messageConfirm` / `notification` / `vLoading` 指令）同样 import 即得样式。`@veltra/vite` 的 `VeltraUIResolver` 已废弃（npm 已标记 deprecate），按需导入一律显式 import。

## 前置条件

- Node.js：`>=20`（`sass-embedded` 要求）。
- Vue：`>=3.5.43`（`@veltra/desktop` 的 peerDependencies 约束）。
- 包管理器：本文用 `bun`，`npm` / `pnpm` / `yarn` 命令等价替换。
- `@veltra/desktop` 的 peer 依赖必须由宿主安装（清单核自 `packages/desktop/package.json` 的 `peerDependencies`）：
  - `vue` `>=3.5.43`
  - `@cat-kit/core` `>=1.2.1`
  - `@cat-kit/fe` `>=1.2.1`
  - `@veltra/icons`
  - `@veltra/styles`
  - `@veltra/utils`
  - `@veltra/compositions`
  - `@veltra/directives`
- 使用 AI 对话时安装 `@veltra/ai`；使用电子表格时安装 `@veltra/sheet`（引擎 `infinitable` 是它的 dependency，自动安装，无需单独装）。
- 写 `<script lang="tsx">` 的 SFC 或 `.tsx` 文件时，开发依赖必须加 `@vitejs/plugin-vue-jsx`（仓库锁 `^5.1.6`），并在 `vite.config.ts` 的 `plugins` 里注册 `vueJsx()`。缺它时 Vite 用 esbuild 的默认 JSX 运行时（`react`）：dev 启动日志报 `Failed to resolve import "react/jsx-dev-runtime"`，build 报 `Failed to resolve import "react/jsx-runtime"`。类型检查还需 `tsconfig.json` 的 `"jsx": "preserve"`。

## 步骤

1. 安装组件包与 peer 依赖：

   ```bash
   bun add @veltra/desktop @veltra/styles @veltra/utils @veltra/compositions @veltra/directives @veltra/icons @cat-kit/core @cat-kit/fe
   ```

   按需加 AI 或电子表格：

   ```bash
   bun add @veltra/ai          # AI 对话：UAiChat / useChat
   bun add @veltra/sheet                      # 电子表格：USheet（模型/引擎在 infinitable/sheet）
   ```

2. 初始化入口，写入 `src/main.ts`。`import '@veltra/styles/normalize'` 与 `loadTheme()` 必须在组件挂载前执行；不调用 `loadTheme()` 时 `html` 上没有任何 `--u-*` 变量，组件没有颜色：

   ```ts
   import { loadTheme } from '@veltra/styles/theme'
   // src/main.ts
   import { createApp } from 'vue'
   import '@veltra/styles/normalize'

   import App from './App.vue'

   loadTheme() // 不传参时应用 lightTheme，并写 html[data-theme="light"]

   const app = createApp(App)
   app.mount('#app')
   ```

3. 组件注册二选一（禁止混用两种注册同一组件）。

   方式一，全局注册 `app.use(UltraUI)`。`@veltra/desktop/install` 导出名为 `UltraUI` 的 Vue Plugin（default 与 named 均可导入），注册全部 `U*` 组件、指令（`v-ripple` / `v-click-outside` / `v-focus` / `v-loading`）并注入全量组件样式。`@veltra/desktop` 根入口只导出组件与类型，没有 default plugin：

   ```ts
   // src/main.ts（在步骤 2 基础上追加）
   import UltraUI from '@veltra/desktop/install'

   app.use(UltraUI)
   ```

   方式二，显式 import（推荐，天然按需）。在 `<script setup>`、`h()` 渲染函数或 TSX 里用到的组件直接 import，样式随组件模块自动加载，无需任何样式子路径导入：

   ```vue
   <!-- src/App.vue -->
   <script setup lang="ts">
   import { UButton } from '@veltra/desktop'
   </script>

   <template>
     <u-button type="primary">提交</u-button>
   </template>
   ```

   `h()` / TSX / `render` 函数里不会做模板解析：漏写 import 时运行时报 `ReferenceError: UTag is not defined`，不是「组件未注册」警告。

4. 写 `<script lang="tsx">` 的 SFC 或 `.tsx` 文件时，安装并注册 `@vitejs/plugin-vue-jsx`。不注册时 Vite 落到 esbuild 默认 JSX 运行时（`react`），dev 报 `Failed to resolve import "react/jsx-dev-runtime"`、build 报 `Failed to resolve import "react/jsx-runtime"`：

   ```bash
   bun add -D @vitejs/plugin-vue-jsx
   ```

   ```ts
   // vite.config.ts
   import vue from '@vitejs/plugin-vue'
   import vueJsx from '@vitejs/plugin-vue-jsx'
   import { defineConfig } from 'vite'

   export default defineConfig({ plugins: [vue(), vueJsx()] })
   ```

   `tsconfig.json` 需 `"jsx": "preserve"`。TSX 里用到的组件显式 import 即可，样式自动跟随。

5. 仅当项目写 `<style lang="scss">` 且要用 `pkg:@veltra/styles/...` token 函数 / mixin 时配置。`NodePackageImporter` 从 `sass-embedded` 导入，不注册时 `pkg:` 导入报 `Can't find stylesheet to import`：

   ```ts
   // vite.config.ts
   import { NodePackageImporter } from 'sass-embedded'
   import { defineConfig } from 'vite'

   export default defineConfig({
     css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
   })
   ```

   `pkg:` 的解析基准目录按来源分两种：写在**磁盘上的 `.scss` 文件**里时，sass 从该文件所在目录逐级向上找 `node_modules`（本库组件的 `style.scss` 都属这种，bun 把 `@veltra/*` 链接在 `packages/<包>/node_modules/` 下，因此省略参数即可解析）；写在**非磁盘来源**（`css.preprocessorOptions.scss.additionalData` 注入的字符串、把样式内容以字符串交给 sass 的自定义插件）时，sass 只从 `entryPointDirectory` 逐级向上找，省略参数时该目录取 Node 入口（dev 下的 vite 可执行文件）所在目录。此时必须显式传入「自身或其祖先目录的 `node_modules` 中含 `@veltra/styles` 的目录」。本仓库 `playground/vite.config.ts` 显式传仓库根：`new NodePackageImporter(repoRoot)`。

## 完整示例

步骤合并后的最终形态（显式 import 按需 + 可选 TSX 插件 + SCSS 配置），可直接复制：

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx' // 仅写 <script lang="tsx"> / .tsx 时需要
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

```ts
import { loadTheme } from '@veltra/styles/theme'
// src/main.ts
import { createApp } from 'vue'
import '@veltra/styles/normalize'

import App from './App.vue'

loadTheme()

const app = createApp(App)
app.mount('#app')
```

```vue
<!-- src/App.vue：显式 import，样式自动跟随 -->
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
- `<button>` 元素的 class 以 `u-button` 开头（组件已导入，不是未知标签），且 Styles 面板里有 `.u-button` 规则（样式副作用已随组件加载）。

按钮无色、`html` 上查不到 `--u-*`：`main.ts` 缺 `loadTheme()`。`<u-button>` 原样出现在 DOM：该文件没有 import 组件，补 `import { UButton } from '@veltra/desktop'`。按钮结构正确、class 是 `u-button` 但 Styles 面板里搜不到 `.u-button` 规则：使用的是 v2.4.0 之前的旧版包，升级依赖；旧版上可临时 `import '@veltra/desktop/components/button/style'`。

## 注意事项

> [!WARNING]
>
> - 主题初始化是硬规则：`import '@veltra/styles/normalize'` + `loadTheme()` 必须写在入口，且在首次渲染前执行。组件颜色全部走 `--u-*` token，没有兜底值；SSR 时在 `onMounted` 中调用 `loadTheme()`。
> - 本库组件从 `@veltra/desktop` 导入（如 `import { UButton } from '@veltra/desktop'`），不是 `ultra-ui` 单包，也不是从 `@veltra/styles` 导入组件。
> - `@veltra/desktop/install` 才有 `UltraUI` plugin；从 `@veltra/desktop` 根入口 `import UltraUI` 会得到 `undefined`。
> - 两种注册方式只选一种。显式 import 时 `vLoading` 等指令从 `@veltra/desktop` 或 `@veltra/directives` 导入，样式同样自动跟随。
> - 样式随组件模块自动加载 v2.4.0 起（此前版本样式是独立入口，需手动 `import '@veltra/desktop/components/<目录>/style'` 或走 resolver）。全量样式入口 `import '@veltra/desktop/style'` 仍然可用，一般无需。
> - 从 `VeltraUIResolver` 迁移：删除 `vite.config.ts` 里的 `Components({ resolvers: [VeltraUIResolver()] })` 与 `@veltra/vite`、`unplugin-vue-components` 依赖，为模板中每个 `<u-xxx>` / `<Uxxx>` 标签补显式 import，删除 `components.d.ts`。`@veltra/vite` 已在 npm 标记废弃，不再发版。
> - 写 `<script lang="tsx">` / `.tsx` 必须在 Vite 注册 `@vitejs/plugin-vue-jsx` 并安装同名包；缺它时 Vite 用 esbuild 默认的 `react` JSX 运行时，dev 报 `Failed to resolve import "react/jsx-dev-runtime"`、build 报 `Failed to resolve import "react/jsx-runtime"`。TSX 里的组件显式 import 即可。
> - `pkg:@veltra/styles/...` SCSS 导入必须先注册 `NodePackageImporter`。磁盘上的 `.scss` 文件里写 `pkg:` 时 sass 从该文件目录向上找 `node_modules`，省略参数即可；只有 `pkg:` 出现在非磁盘来源（`additionalData` 注入的字符串等）时才必须显式传「其 `node_modules` 含 `@veltra/styles` 的目录」——该目录必须是链接所在目录，传一个不含 `@veltra/*` 链接的目录仍然解析失败。`new NodePackageImporter(repoRoot)` 是本仓库 `playground/` 应用的写法。
