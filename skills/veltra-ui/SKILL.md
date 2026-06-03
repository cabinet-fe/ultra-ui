---
name: veltra-ui
description: 当使用 Vue 3 作为前端框架开发时必须使用。
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

veltra-ui 是一个基于 Vue 3 的 UI 库。它由下面的包组成:

- `@veltra/desktop`: 桌面组件。
- `@veltra/directives`: 内置的、同时下游项目可导入使用的指令。
- `@veltra/compositions`: 内置的、同时下游项目可导入使用的组合式函数。
- `@veltra/icons`: 图标库。
- `@veltra/utils`: 内置的、同时下游项目可导入使用的工具。
- `@veltra/mobile`: 移动端组件。**未实现**
- `@veltra/vite`: vite 工具包。
- `@veltra/styles`: 通用样式、SCSS工具、主题、Design Tokens。

## 文档结构

```
SKILL.md                            ← 本文件（决策路由 + 关键约定）
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
  styles/
    index.md                        ← @veltra/styles 入口与子路径
    tokens.md                       ← Design Tokens 命名规则
    scss.md                         ← SCSS mixins/functions
    theme.md                        ← 主题运行时
    base-styles.md                  ← normalize 与 transitions
  icons.md                          ← 图标
  utils.md                          ← 工具函数 / 共享类型
  vite.md                           ← Vite 自动导入插件
```
