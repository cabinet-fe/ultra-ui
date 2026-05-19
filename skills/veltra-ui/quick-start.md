# 快速开始

在项目中使用 Veltra Ultra UI 的最短路径。

## 1. 安装

```bash
bun add @veltra/desktop @veltra/icons
```

## 2. 配置 main.ts

```ts
import { createApp } from 'vue'
import App from './App.vue'
import UltraUI from '@veltra/desktop/install'
import { loadTheme } from '@veltra/styles/theme'

const app = createApp(App)
loadTheme()
app.use(UltraUI)
app.mount('#app')
```

## 3. 配置 Vite（推荐自动导入）

```bash
bun add @veltra/vite unplugin-vue-components -D
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VeltraDesktopUIResolver } from '@veltra/vite'
import { NodePackageImporter } from 'sass-embedded'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VeltraDesktopUIResolver()] })],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

## 4. 开始使用

```vue
<template>
  <u-button type="primary" @click="showDialog = true">打开对话框</u-button>

  <u-dialog v-model="showDialog" title="提示">
    <p>这是一个对话框示例</p>
    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const showDialog = ref(false)
</script>
```

## 下一步

- packages/desktop/installation.md — 完整安装指南（按需引入、主题定制）
- gotchas.md — 易错点清单（必读）
- packages/desktop/index.md — 浏览全部组件
