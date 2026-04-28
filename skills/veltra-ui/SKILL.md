---
name: veltra-ui
description: >
  Veltra Ultra UI — Vue 3 组件库完整开发参考。涵盖 70+ 桌面组件目录、80+ U 组件导出、组合式函数、自定义指令、
  SCSS/BEM 样式体系、主题系统、图标库及 Vite 插件。当你需要在项目中使用 @veltra/* 生态包时，
  本技能提供精确的 API 签名、类型定义和实际代码示例。
---

# veltra-ui

Vue 3 组件库文档型技能。**按需索引，渐进式阅读**——不要一次性加载所有文档，根据当前任务逐步打开对应文件。

## 安装

```bash
bun add @veltra/desktop @veltra/compositions @veltra/directives @veltra/utils @veltra/styles @veltra/icons
bun add @veltra/vite -D
```

## 包索引与路由

| 包名                   | 范畴                | 文档入口                                               | 常用场景                           |
| ---------------------- | ------------------- | ------------------------------------------------------ | ---------------------------------- |
| `@veltra/desktop`      | 70+ 组件目录 / 80+ U 组件导出 | packages/desktop/index.md | 使用组件、查询 Props/Emits/Slots   |
| `@veltra/compositions` | 13 个组合式函数     | packages/compositions.md   | 表单回退、浮框定位、拖拽、虚拟滚动 |
| `@veltra/directives`   | 3 个自定义指令      | packages/directives.md       | v-ripple、v-click-outside、v-focus |
| `@veltra/utils`        | 工具函数 + 共享类型 | packages/utils.md                 | BEM 类名、类型定义、常量           |
| `@veltra/styles`       | SCSS 体系 + 主题    | packages/styles.md               | BEM mixins、CSS 变量函数、主题切换 |
| `@veltra/icons`        | SVG 图标组件        | packages/icons.md                 | 引用图标                           |
| `@veltra/vite`         | Vite 辅助插件       | packages/vite.md                   | 按需导入配置                       |

## 渐进式阅读路径

### 路径 A：使用组件

1. 直接打开 packages/desktop/index.md → 找到组件 → 打开独立文档
2. 如需了解安装流程 → quick-start.md
3. 如需了解 BEM/主题/尺寸体系 → core-concepts.md

### 路径 B：自定义组件/扩展

1. 使用组合式函数 → 直接读 packages/compositions.md
2. 自定义 SCSS 样式 → 直接读 packages/styles.md
3. 需要了解架构体系 → core-concepts.md

### 路径 C：配置构建工具

1. 读 packages/vite.md — Vite 自动导入
2. 读 packages/icons.md — 图标按需引入

## 导航速查

- 不知道用什么？→ index.md 全量目录
- 表单体系？→ packages/desktop/components/form.md
- 想了解主题？→ packages/styles.md 的「Theme 系统」
- 备忘录/命名？→ `message` 小写函数，`Notification` 大写函数

## 源码定位

当文档不足以解答问题时，可查看安装产物中的类型定义：

- references/source-discovery.md — 如何在 `node_modules/@veltra/*` 中定位产物和类型声明

## 约定

- 所有导入均通过主包路径 `@veltra/desktop` 引入，示例 `import { UButton } from '@veltra/desktop'`
- 全局安装通过 `@veltra/desktop/install` 引入，示例 `import UltraUI from '@veltra/desktop/install'`
- 类型导入使用 `import type { ButtonProps } from '@veltra/desktop'`
- CSS 类名前缀 `u-`，组件名前缀 `U`，指令名前缀 `v`
