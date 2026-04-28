# 快速开始

在项目中使用 Veltra Ultra UI 的最短路径。

完整安装说明 → [packages/desktop/installation.md](packages/desktop/installation.md)

## 安装

```bash
bun add @veltra/desktop @veltra/icons
```

`@veltra/desktop` 自动带入 `@veltra/utils`、`@veltra/compositions`、`@veltra/directives`、`@veltra/styles` 等 peer 依赖。详细安装及配置见 [installation.md → 安装](packages/desktop/installation.md#安装)。

## 全局注册

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import UltraUI from '@veltra/desktop'

const app = createApp(App)
app.use(UltraUI)
app.mount('#app')
```

`app.use(UltraUI)` 注册全部 `U*` 组件 + `v*` 指令并注入样式。详见 [installation.md → 全局注册](packages/desktop/installation.md#全局注册)。

## 按需引入

```vue
<script setup lang="ts">
import { UButton } from '@veltra/desktop'
import { UInput } from '@veltra/desktop'
</script>

<template>
  <u-button type="primary">点击</u-button>
  <u-input v-model="value" placeholder="请输入" />
</template>
```

样式自动通过 `style.ts` 副作用入口加载。详见 [installation.md → 按需引入](packages/desktop/installation.md#按需引入)。

## Vite 自动导入（推荐）

```bash
bun add @veltra/vite unplugin-vue-components -D
```

```ts
import Components from 'unplugin-vue-components/vite'
import { VeltraDesktopUIResolver } from '@veltra/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [VeltraDesktopUIResolver()] })
  ]
})
```

配置后在模板中直接使用组件，无需手动 import。详见 [installation.md → Vite 自动导入](packages/desktop/installation.md#vite-自动导入推荐)。

## 第一个示例

```vue
<template>
  <u-button type="primary" @click="showDialog = true">打开对话框</u-button>

  <u-dialog v-model:visible="showDialog" title="提示" @confirm="handleConfirm">
    <p>这是一个对话框示例</p>
  </u-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showDialog = ref(false)

function handleConfirm() {
  console.log('确认')
}
</script>
```

## 引入主题

```ts
import { loadTheme } from '@veltra/styles/theme'

// 在应用入口调用，自动支持 prefers-color-scheme
loadTheme()
```

亮色/暗色切换、自定义主题及完整 main.ts 示例见 [installation.md → 主题初始化](packages/desktop/installation.md#主题初始化)。

## 下一步

- [packages/desktop/installation.md](packages/desktop/installation.md) — 完整安装指南（SCSS 配置、自定义主题、完整示例）
- [core-concepts.md](core-concepts.md) — 理解 BEM 类名、主题系统和组件模式
- [packages/desktop/index.md](packages/desktop/index.md) — 浏览全部组件
- [packages/styles.md](packages/styles.md) — 深入了解样式和主题

