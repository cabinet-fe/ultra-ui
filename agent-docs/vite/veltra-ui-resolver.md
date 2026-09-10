---
title: "VeltraUIResolver 组件按需自动引入解析器"
description: "@veltra/vite 导出的 unplugin-vue-components 解析器：按组件名解析 @veltra/desktop、@veltra/ai、@veltra/sheet 的 95 个 U* 组件，并自动引入对应目录的 style 副作用（开发走 veltra-dev 源码 SCSS，构建走 dist 预编译样式）；显式 import 的组件与 JSX / 渲染函数里的组件不会被解析。"
aliases: [veltra-ui-resolver, VeltraUIResolver, resolver, unplugin-vue-components, 按需导入, 自动导入]
keywords: ["VeltraUIResolver", "VeltraUIResolverOptions", "importStyle", "@veltra/vite", "unplugin-vue-components", "sideEffects", "veltra-dev", "ComponentResolver", "_resolveComponent", "is not defined", "@vitejs/plugin-vue-jsx", "react/jsx-dev-runtime", 按需导入, 样式副作用, 自动引入, 组件解析, 裸样式, 渲染函数, 显式导入, tree-shaking, dts]
---

# VeltraUIResolver 组件按需自动引入解析器

`@veltra/vite` 导出解析器工厂 `VeltraUIResolver`，供 `unplugin-vue-components` 使用：模板里直接写 `<UButton>` 等组件而不 import，插件在编译期把它替换成从 `@veltra/desktop`、`@veltra/ai`、`@veltra/sheet` 的具名导入，并默认附带该组件目录的 `style` 副作用引入。

解析只作用于 SFC 编译产物里的 `_resolveComponent("<组件名>")` 调用：模板标签在当前 `<script setup>` 中没有同名绑定时，Vue 才会生成该调用。因此「显式 import 的组件」与「JSX / `h()` 渲染函数里的组件」都不在解析范围内——前者不产生调用，后者根本不经过模板编译。

## 快速上手

安装 `@veltra/vite` 与 `unplugin-vue-components` 后，在 `vite.config.ts` 注册（`@veltra/vite` 放宿主 `devDependencies`）：

```bash
npm i -D @veltra/vite unplugin-vue-components
```

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [VeltraUIResolver()] }),
  ],
})
```

之后模板里直接写组件，编译期自动生成 import 与样式引入：

```vue
<!-- 源码：无需 import { UButton } from '@veltra/desktop' -->
<template>
  <u-button type="primary">确定</u-button>
</template>
```

JSX / 渲染函数里的组件不会被解析，必须显式 import 并补样式子路径（样式副作用同样不会自动注入）：

```vue
<script setup lang="ts">
import { h } from 'vue'
import { UTag } from '@veltra/desktop'
import '@veltra/desktop/components/tag/style'

const label = () => h(UTag, { type: 'success' }, () => '已通过')
</script>

<template>
  <!-- 模板组件仍走 resolver -->
  <u-layout>{{ label() }}</u-layout>
</template>
```

写 JSX（`<script lang="tsx">` 或 `.tsx`）时还必须在 Vite 注册 `@vitejs/plugin-vue-jsx`，缺它时报 `Failed to resolve import "react/jsx-dev-runtime"`（build 为 `react/jsx-runtime`）。

## API 签名

```ts
import type { ComponentResolver } from 'unplugin-vue-components/types'

export interface VeltraUIResolverOptions {
  /**
   * 是否把组件样式作为副作用（sideEffects）自动引入。
   * @default true
   */
  importStyle?: boolean
}

/** 解析器工厂：传入 options（可省略），返回 unplugin-vue-components 的 ComponentResolver */
export function VeltraUIResolver(options?: VeltraUIResolverOptions): ComponentResolver
```

resolver 的运行时行为：`type: 'component'`，对每个模板中出现的组件名查一张静态生成的组件表（`Map<string, { from, style }>`）；命中则返回 `{ name, from, sideEffects }`，未命中返回 `undefined` 交给下一个 resolver 或插件默认逻辑。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `options` | `VeltraUIResolverOptions` | `{}` | 否 | 整个 options 对象可省略 |
| `options.importStyle` | `boolean` | `true` | 否 | `true`：每个组件额外引入 `'<包名>/components/<dir>/style'` 副作用；`false`：只生成组件 import，样式由宿主自行引入（例如全量 `import '@veltra/desktop/style'` 或自建 SCSS 管线） |

组件表（`components.gen.ts`）由 `bun run resolver:gen` 扫描生成，共 95 个组件：`@veltra/desktop` 92 个（`UAction`、`UButton`、`UForm`、`USelect`、`UTable`、`UTree` 等）、`@veltra/ai` 2 个（`UAiChat`、`UAiOrb`）、`@veltra/sheet` 1 个（`USheet`）。判定规则：扫描各包 `src/components/` 下**同时含 `index.ts` 与 `style.ts`** 的直接子目录，取其 `index.ts` 中 `export {}` 的 `U*` 值导出（类型导出与非 `U*` 导出跳过）；一个目录可承载多个组件（如 `button/` 目录导出 `UButton` 与 `UButtonGroup`，样式路径相同）。

## 方法与事件

无方法、无事件。宿主侧可控行为：

- 解析时机：`unplugin-vue-components` 对 SFC 编译产物做正则重写，只替换 `_resolveComponent("<组件名>")` 调用；命中组件表则在该文件顶部插入组件 import 与（`importStyle` 为 `true` 时）样式副作用 import。模板标签在 `<script setup>` 中有同名绑定时编译产物直接引用该绑定，不产生 `_resolveComponent` 调用，resolver 不会介入。
- `importStyle: true`（默认）时样式路径无扩展名，靠包 `exports` 条件解析：Vite 开发走 `veltra-dev` 条件到源码 `src/<dir>/style.ts`（SCSS 源码管线，完整 HMR）；Vite 构建走 `import` 条件到 `dist/<dir>/style.js`（预编译产物，CSS 由 JS 入口引入）。使用 SCSS 源码管线要求宿主按 `guide/scss.md` 注册 `NodePackageImporter`。
- `@veltra/ai`、`@veltra/sheet` 是可选 peer 依赖：未安装这两个包时 resolver 照常工作，模板里不写对应组件即可；写了而包未安装会在解析时报模块找不到。
- CI 校验：`bun run resolver:gen -- --check` 校验组件表是否最新（不落盘），已并入仓库 `ci:verify`。

## 典型示例

### 完整 vite.config（SCSS 源码样式 + dts）

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NodePackageImporter } from 'sass-embedded'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  css: {
    // 开发态 resolver 引入的是 src/<dir>/style.ts（SCSS 源码），
    // 其中的 pkg:@veltra/styles 导入依赖 NodePackageImporter 解析
    preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } },
  },
  plugins: [
    vue(),
    Components({
      resolvers: [VeltraUIResolver()],
      dts: true, // 生成 components.d.ts，恢复模板内组件的类型提示
    }),
  ],
})
```

monorepo 内引用 workspace 包时，`NodePackageImporter` 构造函数必须传仓库根路径（`new NodePackageImporter(repoRoot)`），否则解析不到 `@veltra/*`。

### 关闭样式副作用

宿主自行控制样式引入时关掉 `importStyle`：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VeltraUIResolver({ importStyle: false })],
    }),
  ],
})
```

```ts
// src/main.ts：样式改为宿主统一引入
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'
import '@veltra/desktop/style'

loadTheme()
```

### 只装了 @veltra/desktop 的最小接入

```ts
// vite.config.ts：@veltra/ai、@veltra/sheet 未安装也可用（可选 peer）
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })],
})
```

## 注意事项

> [!WARNING]
> - resolver 只解析组件表内**按名精确匹配**的组件：`<u-button-group>` 命中 `UButtonGroup`，但动态组件 `<component :is="'UButton'">`、`resolveComponent()` 的运行时调用、以及表内不存在的名字（如 `USheetHeader`）不会生效。
> - 模板组件禁止在同一个 SFC 的 `<script setup>` 里再 import 同名组件。显式 import 后模板改用该绑定、不再产生 `_resolveComponent("UButton")` 调用，resolver 不注入组件 import，也**不注入样式副作用**——症状是页面结构与 class 都正确，但 Styles 面板里没有 `.u-button` 规则。显式 import 的组件必须自己补 `import '@veltra/desktop/components/button/style'`。
> - JSX / `h()` / `render` 函数里的组件永不被解析（不经过模板编译），必须显式 import，并且同样要自己补样式子路径；漏 import 时浏览器控制台报 `ReferenceError: UTag is not defined`。写 `<script lang="tsx">` 或 `.tsx` 还必须在 Vite 注册 `@vitejs/plugin-vue-jsx`，否则报 `Failed to resolve import "react/jsx-dev-runtime"`（build 为 `react/jsx-runtime`）。
> - 本库组件名是 `U*` 前缀（`UButton`），不是 Element Plus 的 `El` 前缀，也不是 Ant Design Vue 的 `a-` 前缀；写 `<el-button>` 不会被解析。
> - resolver 只管 import 与样式副作用；主题初始化（`import '@veltra/styles/normalize'` + `loadTheme()`）仍必须由宿主入口完成，自动引入不包含这两步。
> - 非组件导出（compositions、utils、`UForm` 之外的 `useConfig` 等）不经 resolver，必须显式 import；函数式 API `message` / `messageConfirm` / `notification` 的样式也不随函数 import 注入，需显式引 `@veltra/desktop/components/<目录>/style`。
> - 组件表是生成文件（`packages/vite/src/components.gen.ts`，注释「请勿手动编辑」）：`@veltra/desktop` / `@veltra/ai` / `@veltra/sheet` 增删组件后必须重跑 `bun run resolver:gen`，否则新组件解析不到。
> - resolver 需要组件目录同时有 `index.ts` 与 `style.ts` 才会入表；无独立样式文件的纯逻辑组件（若有）不会被自动引入。

## 常见问题

### 组件未自动导入，模板里写了 `<u-button>` 却报 `Failed to resolve component: u-button`

按顺序排查：

1. `vite.config.ts` 没注册 `Components` 插件或没传 resolver。确认两处都在：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })],
})
```

2. `unplugin-vue-components` 版本低于 32：本包 peer 约束是 `unplugin-vue-components >= 32.0.0`，升级后重试。
3. 修改配置后未重启 dev server：插件在启动时注入转换器，改 `vite.config.ts` 必须重启。
4. 组件确实不在表内：对照 `packages/vite/src/components.gen.ts` 查组件名；仓库内缺组件时重跑 `bun run resolver:gen`，下游发布包缺组件时升级 `@veltra/desktop`。
5. 组件名拼写错误：表按 `UButton` 精确匹配，`UButtons`、`Ubtn` 均不命中。

### 样式没生效（组件渲染但无颜色 / 无布局）

先按症状分两种：

**类名在、样式规则不在**（DevTools 里 `<button class="u-button">` 存在，但 Styles 面板搜不到 `.u-button` 规则）：该组件被显式 import 了（resolver 只处理模板里未绑定的组件），或 `importStyle` 被设成 `false`。修复：删掉模板组件的显式 import 交给 resolver，或保留 import 并成对补样式子路径：

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'
import '@veltra/desktop/components/button/style'
</script>

<template>
  <u-button type="primary">确定</u-button>
</template>
```

**类名与规则都在、但整体灰暗**：主题 token 为空，与 resolver 无关，需在入口 `import '@veltra/styles/normalize'` 并调用 `loadTheme()`。

若 `pkg:@veltra/styles/...` 报 `Can't find stylesheet to import`，说明 SCSS 源码管线缺少 importer 配置（开发态 resolver 引入的是 `src/<dir>/style.ts`）：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NodePackageImporter } from 'sass-embedded'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } },
  plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })],
})
```

磁盘 `.scss` 文件里的 `pkg:` 由 sass 从该文件目录向上找 `node_modules`，省略参数即可解析；只有 `pkg:` 出现在非磁盘来源（`additionalData` 注入的字符串等）时才必须显式传「其 `node_modules` 含 `@veltra/styles` 的目录」。

### 渲染函数里的组件报 `ReferenceError: UTag is not defined`

原因：`h()` / `render` / JSX 里的组件不会经过模板编译，resolver 不会为它们生成 import。修复：显式导入组件，并补样式子路径（样式副作用同样不会自动注入）：

```ts
// src/columns.ts
import { h } from 'vue'
import { UAction, UActionGroup, UTag } from '@veltra/desktop'
import '@veltra/desktop/components/action/style'
import '@veltra/desktop/components/tag/style'

export const statusColumn = {
  key: 'status',
  name: '状态',
  render: ({ rowData }: { rowData: Record<string, unknown> }) =>
    h(UTag, { type: 'success' }, () => String(rowData['status']))
}

export const actionColumn = {
  key: 'actions',
  name: '操作',
  render: () => h(UActionGroup, {}, () => [h(UAction, { onRun: () => {} }, () => '详情')])
}
```

写 JSX（`<script lang="tsx">` 或 `.tsx`）时还需在 Vite 注册 `@vitejs/plugin-vue-jsx`：缺它时报 `Failed to resolve import "react/jsx-dev-runtime"`（build 为 `react/jsx-runtime`）。

