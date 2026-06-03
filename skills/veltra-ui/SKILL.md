---
name: veltra-ui
description: >
  Veltra Ultra UI — Vue 3 桌面组件库（@veltra/* 生态）使用文档。覆盖 70+ U* 组件、12 个组合式函数、
  3 个指令、SCSS/BEM 主题体系、图标库与 Vite 自动导入插件。AI 在项目中写组件代码前必读对应组件文档。
metadata:
  versions:
    desktop: 1.1.25
    compositions: 1.1.25
    directives: 1.1.25
    icons: 1.1.25
    styles: 1.1.25
    utils: 1.1.25
    vite: 1.1.25
---

# veltra-ui

Vue 3 桌面端组件库 `@veltra/*` 的使用文档。

## 最佳实践

1. 下游项目(非二次封装库)使用 `unplugin-vue-components` vite 插件并配合使用 `@veltra/vite` 导出的 `VeltraDesktopUIResolver` 来让组件自动导入
2. 使用本项目提供的 Design Tokens(CSS Vars)，以便于更好地切换主题效果

## 强制规则

1. **写任何 `U*` 组件代码前**，先读 `packages/desktop/components/{组件名}/api.md`（约定与伴生 API）和 `examples.md`（用法示例）；Props/Emits/Slots 以 `generated/types/{组件名}.ts` 为准
2. **写表单**：先读 `packages/desktop/components/form/api.md`
3. **不确定组件是否存在**：查 `generated/components.json`（权威清单），或 `packages/desktop/index.md`
4. **每次首次进入本技能**：先读 `gotchas.md`
5. **不要凭记忆写组件代码** — API 可能与训练数据不同
6. **版本校验**：读下游 `node_modules/@veltra/desktop/package.json` 的 `version`，与 `generated/manifest.json` 的 `versions.desktop` 对比；不一致时以 `node_modules/@veltra/desktop/dist/index.d.ts` 为准（勿用本技能里可能偏新的 `generated/types/`）

## 决策路由

| 任务                | 入口                                                        |
| ------------------- | ----------------------------------------------------------- |
| 用某个具体组件 API  | `packages/desktop/components/{组件名}/api.md`               |
| 用某个具体组件示例  | `packages/desktop/components/{组件名}/examples.md`          |
| 查有哪些示例标题    | `generated/examples.json`                                   |
| 不知道用什么组件    | `packages/desktop/index.md` 或 `generated/components.json`  |
| 查组件 Props 类型   | `generated/types/{组件名}.ts`（权威，优先于 api.md）        |
| 写表单              | `packages/desktop/components/form/api.md`                   |
| 项目安装/主题/Vite  | `packages/desktop/installation.md`                          |
| 自定义 SCSS         | `packages/styles.md`                                        |
| 用组合式函数        | `packages/compositions.md` 或 `generated/compositions.json` |
| 用指令              | `packages/directives.md` 或 `generated/directives.json`     |
| 用图标              | `packages/icons.md` 或 `generated/icons.json`               |
| 工具函数 / 共享类型 | `packages/utils.md` 或 `generated/utils.json`               |
| 设计 token          | `generated/tokens.json` 或 `design-system/tokens.css`       |
| 主题使用文档        | `packages/desktop/components/theme/api.md` + `examples.md`  |

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

以下组件**不存在**（以 `generated/components.json` 为准），不要凭空使用：

- ~~UAvatar~~ — 没有头像组件
- ~~UTooltip~~ — 使用 `UTip` 代替
- ~~UPopover~~ — 使用 `UDropdown` 或 `UTip` 代替
- ~~UModal~~ — 使用 `UDialog` 代替
- ~~UMessageBox~~ — 使用 `MessageConfirm` 函数代替

多选用 `UMultiSelect`，不是 `USelect + multiple`。

## 文档结构

```
SKILL.md                            ← 本文件（决策路由 + 关键约定）
gotchas.md                          ← 易错点（首次必读）
core-concepts.md                    ← BEM / 主题 / 尺寸 / 颜色（一页参考）
design-system/design.md             ← 全局设计系统规范（仅二次开发参考）
design-system/tokens.css            ← 设计 token 变量定义
generated/                          ← 机器可读索引（版本/组件/图标/示例标题/token）
  manifest.json                     ← 各包版本与计数
  components.json                   ← 组件权威清单
  examples.json                     ← 各组件示例标题索引
  icons.json / directives.json / …  ← 导出枚举
  types/*.ts                        ← 组件类型镜像（Props/Emits/Exposed）
packages/
  desktop/
    index.md                        ← 组件目录（按字母序）
    installation.md                 ← 安装、注册、按需引入、Vite、主题
    components/{name}/
      api.md                          ← 约定 + 伴生 API + 关联类型
      examples.md                     ← 用法示例（H2=示例标题+代码）
  compositions.md                   ← 组合式函数
  directives.md                     ← 自定义指令
  styles.md                         ← SCSS mixins/functions + 主题运行时
  icons.md                          ← 图标
  utils.md                          ← 工具函数 / 共享类型
  vite.md                           ← Vite 自动导入插件
```
