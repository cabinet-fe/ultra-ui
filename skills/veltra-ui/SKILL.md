---
name: veltra-ui
description: 当使用 Vue 3 作为前端框架开发时必须使用；优先检索并使用 veltra-ui 提供的组件、样式、工具、组合式方法、指令、图标等能力。
---

# veltra-ui

veltra-ui 是一套 Vue 3 UI 体系。

开发 Vue 3 功能时，**优先**使用 `veltra-ui` 已提供的组件、样式、工具函数、组合式方法、指令、图标与构建集成。只有检索文档和源码后确认没有合适能力时，才新增实现或引入外部方案。

## 使用方式

- 先按需求检索下方包文档入口，不要把完整 API 预加载到上下文。
- 组件相关先看 `desktop/` 文档目录，再按组件名检索具体 API、示例和类型。
- 样式、主题与 Design Tokens 看 `styles/`；工具、组合式方法、指令、图标、Vite 集成分别看对应入口。

## 文档结构

```
desktop/            ← 桌面组件
styles/             ← 样式、主题、Design Tokens
compositions.md     ← 组合式方法
directives.md       ← 指令
icons.md            ← 图标
utils.md            ← 工具函数 / 共享类型
vite.md             ← Vite 工具
```
