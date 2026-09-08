---
title: Ultra UI 库文档概览
description: Ultra UI（@veltra/*）面向 Vue 3 的组件与能力库总览，涵盖安装接入、主题、桌面组件、AI 对话、电子表格、组合式函数、工具函数与按需导入解析器。
keywords:
  - Ultra UI
  - @veltra
  - Vue 3
  - 组件库
  - 安装
  - 文档索引
aliases:
  - ultra-ui
  - veltra
  - 库概览
  - index
---

## 快速上手

Ultra UI 是面向 Vue 3 应用的组件与能力库，npm 作用域为 `@veltra/*`。接入时入口必须导入全局 reset 并调用 `loadTheme()`，否则组件会呈现无主题色的裸 HTML。

```bash
bun add @veltra/desktop
```

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()

createApp(App).mount('#app')
```

完整安装、三种组件注册方式与按需自动导入，见 `recipes/install.md`。主题与 Design Token 见 `recipes/theme.md`。

## 包与模块

| 包名                   | 定位                              | 文档入口                        |
| :--------------------- | :-------------------------------- | :------------------------------ |
| `@veltra/desktop`      | 桌面端 UI 组件（`U*` 前缀）       | `desktop/` 目录                 |
| `@veltra/ai`           | AI 对话与动效组件                 | `ai/ai-chat.md`、`ai/ai-orb.md` |
| `@veltra/sheet`        | 电子表格 UI 组件                  | `sheet/sheet.md`                |
| `@veltra/sheet-core`   | 表格数据模型、公式与 I/O          | `sheet-core/` 目录              |
| `@veltra/compositions` | 组合式函数（`use*`）              | `compositions/` 目录            |
| `@veltra/utils`        | DOM、BEM、滚动等工具函数          | `utils/` 目录                   |
| `@veltra/directives`   | Vue 指令（`v-*`）                 | `directives/` 目录              |
| `@veltra/icons`        | SVG 图标（normal / colorful）     | `icons.md`                      |
| `@veltra/styles`       | 全局 reset、主题与 SCSS token     | `styles/` 目录                  |
| `@veltra/vite`         | `VeltraUIResolver` 按需导入解析器 | `vite/veltra-ui-resolver.md`    |

## 场景配方

面向常见业务场景的端到端指引：

| 文档                 | 说明                                 |
| :------------------- | :----------------------------------- |
| `recipes/install.md` | 安装、入口初始化、全局注册与按需导入 |
| `recipes/theme.md`   | 主题加载、深浅色切换、自定义品牌色   |
| `recipes/form.md`    | 表单布局、校验与字段联动             |
| `recipes/pages.md`   | 列表页、详情页等页面骨架             |
| `recipes/sheet.md`   | 电子表格接入与交互                   |
| `recipes/ai.md`      | AI 对话界面集成                      |

## 桌面组件速查

`desktop/` 目录按组件拆分，每篇包含 `## 快速上手`、`## 典型示例`、`## API 签名 / 类型定义`、`## 注意事项` 等章节，便于按 section 精准检索。

常用组件：

| 组件                   | 文档                                        |
| :--------------------- | :------------------------------------------ |
| UButton / UButtonGroup | `desktop/button.md`                         |
| UForm / UFormItem      | `desktop/form.md`、`desktop/form-item.md`   |
| UTable                 | `desktop/table.md`                          |
| UDialog / UDrawer      | `desktop/dialog.md`、`desktop/drawer.md`    |
| USelect / UInput       | `desktop/select.md`、`desktop/input.md`     |
| UDatePicker            | `desktop/date-picker.md`                    |
| UTree / UTreeSelect    | `desktop/tree.md`、`desktop/tree-select.md` |

其余 70+ 组件均在 `desktop/` 下，文件名与组件 kebab 名一致（如 `UAutoComplete` → `desktop/auto-complete.md`）。

## 组合式函数与工具

| 类别     | 代表能力                         | 文档                                                  |
| :------- | :------------------------------- | :---------------------------------------------------- |
| 浮层定位 | `usePop`                         | `compositions/use-pop.md`                             |
| 虚拟滚动 | `useVirtualizer`                 | `compositions/use-virtualizer.md`                     |
| 拖拽     | `useDrag`、`useDnd`              | `compositions/use-drag.md`、`compositions/use-dnd.md` |
| DOM 类名 | `addClass`、`removeClass`、`bem` | `utils/add-class.md`、`utils/bem.md`                  |
| 滚动     | `scrollIntoContainerView`        | `utils/scroll-into-container-view.md`                 |

## 注意事项

> [!WARNING]
>
> - **主题必须初始化**：未调用 `loadTheme()` 时所有 `--u-*` token 为空，组件无颜色。
> - **图标导入路径**：优先 `@veltra/icons/normal` 或 `@veltra/icons/colorful`，避免从根 `@veltra/icons` 全量导入。
> - **按需导入**：使用 `VeltraUIResolver` 时默认自动引入组件样式副作用，关闭后需自行管理样式导入。
