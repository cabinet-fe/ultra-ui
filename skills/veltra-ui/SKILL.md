---
name: veltra-ui
description: >
  Veltra Ultra UI — Vue 3 桌面组件库（@veltra/* 生态）使用文档。覆盖 70+ U* 组件、12 个组合式函数、
  3 个指令、SCSS/BEM 主题体系、图标库与 Vite 自动导入插件。AI 在项目中写组件代码前必读对应组件文档。
metadata:
  versions:
    desktop: 1.1.15
    compositions: 1.1.15
    directives: 1.1.15
    icons: 1.1.15
    styles: 1.1.15
    utils: 1.1.15
    vite: 1.1.15
---

# veltra-ui

Vue 3 桌面端组件库 `@veltra/*` 的使用文档。

## 强制规则

1. **写任何 `U*` 组件代码前**，先读 `packages/desktop/components/{组件名}.md` 确认 Props/Emits/Slots
2. **写表单**：先读 `packages/desktop/components/form.md`
3. **不确定组件是否存在**：查 `packages/desktop/index.md`
4. **每次首次进入本技能**：先读 `gotchas.md`
5. **不要凭记忆写组件代码** — API 可能与训练数据不同

## 决策路由

| 任务                | 入口                                      |
| ------------------- | ----------------------------------------- |
| 用某个具体组件      | `packages/desktop/components/{组件名}.md` |
| 不知道用什么组件    | `packages/desktop/index.md`               |
| 写表单              | `packages/desktop/components/form.md`     |
| 项目安装/主题/Vite  | `packages/desktop/installation.md`        |
| 自定义 SCSS         | `packages/styles.md`                      |
| 用组合式函数        | `packages/compositions.md`                |
| 用指令              | `packages/directives.md`                  |
| 用图标              | `packages/icons.md`                       |
| 工具函数 / 共享类型 | `packages/utils.md`                       |
| 发布流程            | `packages/release.md`                     |

## 安装（最短路径）

```bash
bun add @veltra/desktop @veltra/icons
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import UltraUI from '@veltra/desktop/install'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
createApp(App).use(UltraUI).mount('#app')
```

完整安装/主题/按需引入/Vite 自动导入：见 `packages/desktop/installation.md`。

## 关键约定

### 自动导入下不要 import 组件

项目配置 `VeltraDesktopUIResolver` 后，模板中的 `U*` 组件无需 import。**判断规则：模板标签不 import；script 中调用的函数/类型/图标才 import。**

```vue
<script setup lang="ts">
// 只 import 函数 / 类型 / 图标
import { message, FormModel, formField } from '@veltra/desktop'
import type { ButtonProps } from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary">按钮</u-button>
  <u-input v-model="text" />
</template>
```

### 命名前缀

- 组件名 `U*`（PascalCase）/ `u-*`（kebab-case）；CSS 类前缀 `u-`
- 全局 plugin：`import UltraUI from '@veltra/desktop/install'`（不是 `@veltra/desktop`）
- 图标：`import { X } from '@veltra/icons/normal'`（不是 `@veltra/icons`）
- 函数式 API 大小写：`message`（小写）、`Notification` / `MessageConfirm` / `FormModel` / `formField` / `defineTableColumns`

### 不存在的组件

`UAvatar` `UTooltip` `UPopover` `UModal` `UMessageBox` 不存在 — 用 `UTip` / `UDropdown` / `UDialog` / `MessageConfirm` 替代。多选用 `UMultiSelect`，不是 `USelect + multiple`。

## 文档结构

```
SKILL.md                            ← 本文件（决策路由 + 关键约定）
gotchas.md                          ← 易错点（首次必读）
core-concepts.md                    ← BEM / 主题 / 尺寸 / 颜色（一页参考）
design-system/design.md             ← 全局设计系统规范（仅二次开发参考）
references/source-discovery.md      ← node_modules 中定位类型与产物
packages/
  desktop/
    index.md                        ← 组件目录（按字母序）
    installation.md                 ← 安装、注册、按需引入、Vite、主题
    patterns.md                     ← 通用 Props/Emits/Slots/Exposed 规则
    components/*.md                 ← 各组件独立文档
  compositions.md                   ← 组合式函数
  directives.md                     ← 自定义指令
  styles.md                         ← SCSS mixins/functions + 主题运行时
  icons.md                          ← 图标
  utils.md                          ← 工具函数 / 共享类型
  vite.md                           ← Vite 自动导入插件
  release.md                        ← 发布流程
```
