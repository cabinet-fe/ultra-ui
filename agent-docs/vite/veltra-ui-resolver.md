---
title: "VeltraUIResolver - Vite 与 Webpack 组件按需自动引入解析器"
description: "用于 unplugin-vue-components 的 Ultra UI 组件按需自动导入解析器：自动解析 @veltra/desktop、@veltra/ai、@veltra/sheet 组件及其配套 CSS/SCSS 样式副作用，实现零配置按需加载与样式自动注入"
keywords: ["VeltraUIResolver", "@veltra/vite", "veltra-ui-resolver", "unplugin-vue-components", "按需导入"]
aliases: ["veltra-ui-resolver", "VeltraUIResolver", "resolver"]
---
## 快速上手

`VeltraUIResolver` 给 `unplugin-vue-components` 用，按组件名解析 `@veltra/desktop`、`@veltra/ai`、`@veltra/sheet` 的 `U*` 导出，并默认带上对应目录的 `style` 副作用。`VeltraUIResolverOptions` 只有 `importStyle`，默认 `true`。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VeltraUIResolver()]
    })
  ]
})
```

关闭样式副作用（改由宿主自行 `import` 样式）时：

```ts
import type { VeltraUIResolverOptions } from '@veltra/vite'
import { VeltraUIResolver } from '@veltra/vite'

const options: VeltraUIResolverOptions = { importStyle: false }

Components({ resolvers: [VeltraUIResolver(options)] })
```

组件表在 `@veltra/vite` 包内生成（`bun run resolver:gen`）。判定规则：各包 `@veltra/desktop`、`@veltra/ai`、`@veltra/sheet` 中带 `index.ts` 与 `style.ts` 的组件目录，取其 `U*` 值导出。未安装 `@veltra/ai` / `@veltra/sheet` 时它们是可选 peer，模板里不用对应组件即可。

样式路径无扩展名：开发走 `veltra-dev` condition 到源码 `style.ts`，构建走 `import` condition 到 `dist` 的 `style.js`。`@veltra/vite` 放在宿主的 `devDependencies`，并安装 `unplugin-vue-components`。

