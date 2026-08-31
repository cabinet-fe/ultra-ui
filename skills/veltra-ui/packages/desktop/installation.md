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

配置后可直接在模板中使用，无需任何 import 语句，构建时自动按需加载组件和样式（主题 token 仍需在入口 `loadTheme()`）：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const text = ref('')
</script>

<template>
  <u-button type="primary" @click="visible = true">按钮</u-button>
  <u-dialog v-model="visible" title="提示">
    <u-input v-model="text" />
  </u-dialog>
</template>
```
