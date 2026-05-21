---
name: veltra-ui
description: >
  Veltra Ultra UI — Vue 3 组件库完整开发参考。涵盖 70+ 桌面组件目录、80+ U 组件导出、12 个组合式函数、自定义指令、
  SCSS/BEM 样式体系、主题系统、图标库及 Vite 插件。当你需要在项目中使用 @veltra/* 生态包时，
  本技能提供精确的 API 签名、类型定义和实际代码示例。
metadata:
  versions:
    desktop: 1.1.10
    compositions: 1.1.10
    directives: 1.1.10
    icons: 1.1.10
    styles: 1.1.10
    utils: 1.1.10
    vite: 1.1.10
---

# veltra-ui

Vue 3 组件库文档型技能。

## 强制规则（代理必须遵守）

1. **写任何 `U*` 组件代码前**，必须先读对应的 `components/*.md` 文件确认 Props/Emits/Slots
2. **写表单时**，必须先读 `components/form.md` 了解 FormModel 用法
3. **不确定组件是否存在时**，先查 `packages/desktop/index.md` 确认
4. **每次使用本技能时**，先读 `gotchas.md` 避免常见错误
5. **构建完整页面时**，先读相关组件文档确认 API
6. **不要凭记忆写组件代码** — 组件 API 可能与你训练数据中的不同

## 安装

```bash
bun add @veltra/desktop @veltra/icons
```

peer dependencies（通常自动安装）：`@veltra/utils`、`@veltra/compositions`、`@veltra/directives`、`@veltra/styles`

## 快速决策路由

| 你要做什么                 | 先读这个                           | 再读这个                                  |
| -------------------------- | ---------------------------------- | ----------------------------------------- |
| 用某个具体组件             | `gotchas.md`                       | `packages/desktop/components/{组件名}.md` |
| 不知道用什么组件           | `packages/desktop/index.md`        | 对应组件文档                              |
| 写表单                     | `gotchas.md`                       | `packages/desktop/components/form.md`     |
| 配置项目（安装/主题/Vite） | `packages/desktop/installation.md` | —                                         |
| 写自定义 SCSS              | `packages/styles.md`               | —                                         |
| 理解全局设计系统规范       | `design-system/design.md`          | —                                         |
| 用组合式函数               | `packages/compositions.md`         | —                                         |
| 用图标                     | `packages/icons.md`                | —                                         |

## 包索引

| 包名                   | 文档入口                  | 常用场景                           |
| ---------------------- | ------------------------- | ---------------------------------- |
| `@veltra/desktop`      | packages/desktop/index.md | 组件、Props/Emits/Slots            |
| `@veltra/compositions` | packages/compositions.md  | 属性回退、浮框定位、拖拽、虚拟滚动 |
| `@veltra/directives`   | packages/directives.md    | v-ripple、v-click-outside、v-focus |
| `@veltra/utils`        | packages/utils.md         | BEM 类名、类型定义、常量           |
| `@veltra/styles`       | packages/styles.md        | BEM mixins、CSS 变量函数、主题     |
| `@veltra/icons`        | packages/icons.md         | SVG 图标组件                       |
| `@veltra/vite`         | packages/vite.md          | 按需导入配置                       |
| —                      | packages/release.md       | 发布流程与版本管理                 |

## 关键约定

### 自动导入（大多数项目的情况）

项目配置了 `VeltraDesktopUIResolver` 后，**组件无需手动 import**，直接在模板中使用即可：

```vue
<template>
  <!-- 直接用，不需要 import UButton / UInput / UDialog 等 -->
  <u-button type="primary">按钮</u-button>
  <u-input v-model="text" />
  <u-dialog v-model="show" title="标题">...</u-dialog>
</template>
```

**仍然需要手动 import 的：**

- 类型：`import type { ButtonProps, TableColumn } from '@veltra/desktop'`
- 函数式 API：`import { message, Notification, MessageConfirm, FormModel, formField, defineTableColumns } from '@veltra/desktop'`
- 图标：`import { Search, Plus, Edit } from '@veltra/icons/normal'`
- 主题：`import { loadTheme, setTheme } from '@veltra/styles/theme'`
- 工具：`import { bem } from '@veltra/utils'`

**判断规则：模板中直接写标签的组件不需要 import，`<script>` 中调用的函数/类型/图标需要 import。**

### 其他约定

- 全局 plugin 从 `@veltra/desktop/install` 导入：`import UltraUI from '@veltra/desktop/install'`
- CSS 类名前缀 `u-`，组件名前缀 `U`
- `message` 小写函数，`Notification` 大写函数
- 多选用 `UMultiSelect`，不是 `USelect` + multiple

## 文档结构

```
gotchas.md                          ← 易错点（每次必读）
design-system/design.md             ← 全局设计系统规范入口（协同 tokens.css 与 components.vue 构成的 3-file 规范）
packages/
  desktop/
    index.md                        ← 全部组件目录
    installation.md                 ← 安装与配置
    patterns.md                     ← Props/Emits/Slots 通用模式
    components/*.md                 ← 各组件独立文档
  compositions.md                   ← 组合式函数
  directives.md                     ← 自定义指令
  styles.md                         ← SCSS + 主题
  icons.md                          ← 图标
  utils.md                          ← 工具函数
  vite.md                           ← Vite 插件
  release.md                        ← 发布流程
core-concepts.md                    ← BEM、主题、尺寸体系
references/source-discovery.md      ← 源码定位
```

## 源码定位

当文档不足以解答问题时，可查看安装产物中的类型定义：

- references/source-discovery.md — 如何在 `node_modules/@veltra/*` 中定位产物和类型声明
