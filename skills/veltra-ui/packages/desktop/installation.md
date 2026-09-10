# Desktop — 安装与注册

## 安装

```bash
bun add @veltra/desktop
```

## 必须的全局设置（漏了组件就是无样式裸 HTML）

组件 CSS 全部通过 `var(--u-*)` token 着色，**token 只由 `loadTheme()` 在运行时注入，没有兜底值**。因此无论用哪种注册方式，入口都必须：

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize' // 全局 reset，入口导入一次
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 注入默认浅色主题 token；换主题见 styles/theme.md
```

忘记 `loadTheme()` 的症状：组件渲染出来透明/无底色/无主题色，看起来像"没样式的原生 HTML"。**不要**用手写 CSS 去补，正确做法就是补这一行。

## 全局注册

```ts
// main.ts
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

`app.use(UltraUI)` 会：

1. 注册全部 `U*` 组件
2. 注册全部通用指令（`v-ripple`、`v-click-outside`、`v-focus`、`v-loading`）
3. 注入全部组件样式（不含主题 token，token 始终由 `loadTheme()` 注入）

之后可在任意模板中直接使用 `<UButton>`、`<UInput>` 等。

也可以使用 named import：

```ts
import { UltraUI } from '@veltra/desktop/install'
```

`@veltra/desktop` 根入口只导出组件、函数和类型，不提供默认 plugin。

## 按需引入

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton } from '@veltra/desktop'
import { UInput } from '@veltra/desktop'
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

手动按需引入组件时，需要同时导入对应组件的样式子路径，例如 `@veltra/desktop/components/button/style`。这些入口会带入组件依赖的指令样式、动画样式和 SCSS（主题 token 仍需 `loadTheme()`）。

如果希望手动 import 组件但使用全量样式，可在应用入口导入：

```ts
import '@veltra/desktop/style'
```

## Vite 自动导入（推荐）

```bash
bun add @veltra/vite unplugin-vue-components -D
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraUIResolver } from '@veltra/vite'

export default defineConfig({ plugins: [vue(), Components({ resolvers: [VeltraUIResolver()] })] })
```

配置后模板里可直接使用，无需写组件 import，构建时自动按需加载组件与样式（主题 token 仍需在入口 `loadTheme()`）；下面的例子同时给出「模板组件走 resolver + 渲染函数组件显式 import 并补样式」的混用写法：

```vue
<script setup lang="ts">
import { h, ref } from 'vue'
// 渲染函数 / JSX 里用的组件不会被 resolver 解析：显式 import 并补样式子路径
import { UTag } from '@veltra/desktop'
import '@veltra/desktop/components/tag/style'

const visible = ref(false)
const text = ref('')
const label = (v: string) => h(UTag, { type: 'success' }, () => v)
</script>

<template>
  <u-button type="primary" @click="visible = true">按钮</u-button>
  <u-dialog v-model="visible" title="提示">
    <u-input v-model="text" />
    {{ label(text) }}
  </u-dialog>
</template>
```

混用规则：resolver 只处理**模板里没有对应 `<script setup>` 绑定的组件**。同一个组件显式 import 后，模板标签改由该导入变量渲染，不再产生 `_resolveComponent(...)` 调用，resolver 既不会注入组件 import，也不会注入样式副作用——页面结构正确但呈现裸样式。因此显式 import 的组件必须自己补 `import '@veltra/desktop/components/<目录>/style'`（该目录可查 `@veltra/vite` 的组件表，或看 `@veltra/desktop` 的 `components/<目录>/style` 是否存在）。函数式 API `message` / `messageConfirm` / `notification` 同理：样式不随函数 import 注入。

写 `<script lang="tsx">` 或 `.tsx` 时还必须安装并注册 `@vitejs/plugin-vue-jsx`，否则 Vite 用 esbuild 默认的 `react` JSX 运行时，dev 报 `Failed to resolve import "react/jsx-dev-runtime"`、build 报 `Failed to resolve import "react/jsx-runtime"`。
