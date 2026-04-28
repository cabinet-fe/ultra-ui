# Desktop — 安装与注册

## 安装

```bash
bun add @veltra/desktop
```

`@veltra/desktop` 的 workspace peer dependencies 包括：
- `@veltra/utils`、`@veltra/compositions`、`@veltra/directives`
- `@veltra/styles`、`@veltra/icons`

运行时 dependencies 包括 `@cat-kit/core`、`@cat-kit/excel`、CodeMirror、Lexical、EmbedPDF、VTable 等组件内部依赖。

大多数包管理器会自动安装 peer dependencies。

## 全局注册

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import UltraUI from '@veltra/desktop/install'

const app = createApp(App)
app.use(UltraUI)
app.mount('#app')
```

`app.use(UltraUI)` 会：
1. 注册全部 `U*` 组件
2. 注册全部通用指令（`v-ripple`、`v-click-outside`、`v-focus`、`v-loading`）
3. 注入全部组件样式

之后可在任意模板中直接使用 `<UButton>`、`<UInput>` 等。

也可以使用 named import：

```ts
import { UltraUI } from '@veltra/desktop/install'
```

`@veltra/desktop` 根入口只导出组件、函数和类型，不提供默认 plugin。

## 按需引入

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'
import { UInput } from '@veltra/desktop'
import { vRipple } from '@veltra/directives'
import '@veltra/desktop/components/button/style'
import '@veltra/desktop/components/input/style'
</script>

<template>
  <u-button type="primary" v-ripple>提交</u-button>
  <u-input v-model="value" placeholder="请输入" />
</template>
```

手动按需引入组件时，需要同时导入对应组件的样式子路径，例如 `@veltra/desktop/components/button/style`。这些入口会带入组件依赖的指令样式、动画样式和 SCSS。

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
import { VeltraDesktopUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VeltraDesktopUIResolver()]
    })
  ]
})
```

配置后可直接在模板中使用：

```vue
<template>
  <u-button type="primary" @click="handleClick">按钮</u-button>
  <u-dialog v-model:visible="visible" title="提示">
    <u-input v-model="text" />
  </u-dialog>
</template>
```

无需任何 import 语句，构建时自动按需加载组件和样式。

## SCSS 配置

项目中使用 Veltra 的 SCSS mixins 需要配置 `NodePackageImporter`：

```ts
// vite.config.ts
import { NodePackageImporter } from 'sass-embedded'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        importers: [new NodePackageImporter()]
      }
    }
  }
})
```

## 主题初始化

```ts
// main.ts
import { loadTheme } from '@veltra/styles/theme'

// 加载默认主题（自动支持亮色/暗色切换）
loadTheme()

// 或加载自定义主题
import { lightTheme } from '@veltra/styles/theme'
const custom = lightTheme.new({
  color: { primary: '#1890ff' }
})
loadTheme(custom)
```

## 完整 main.ts 示例

```ts
import { createApp } from 'vue'
import App from './App.vue'
import UltraUI from '@veltra/desktop/install'
import { loadTheme } from '@veltra/styles/theme'

const app = createApp(App)

// 1. 注册组件库
app.use(UltraUI)

// 2. 加载主题
loadTheme()

app.mount('#app')
```
