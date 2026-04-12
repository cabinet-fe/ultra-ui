---
name: veltra-directives
description: 面向 `@veltra/directives` 的 Vue 自定义指令文档技能。用于理解或修改 `vFocus`、`vClickOutside`、`vRipple` 的绑定契约、文档级事件清理、样式副作用入口与导出约定，或新增需要在 `@veltra/desktop` 中批量复用的指令时使用。
---

# Veltra Directives

## 先判断你在做什么

- 需要先在消费项目里定位 `@veltra/directives` 的源码、样式入口或安装产物时，读取 [references/source-discovery.md](references/source-discovery.md)
- 查现有三条指令行为与 binding 约束时，读取 [references/api.md](references/api.md)
- 新增或重构指令目录、`style.ts`、exports 与 sideEffects 时，读取 [references/authoring.md](references/authoring.md)

## 处理指令时保持这些约束

- 指令命名使用 `v` + camelCase
- 导出类型使用 `ObjectDirective`
- 需要样式时必须提供 `style.ts` 副作用入口
- 所有 document/window 级监听都要有明确的注册与清理
- 与样式系统集成时走 `@veltra/styles` 的 Sass 基础设施，不要在这里发明新的样式约定

## 快速源码锚点

- `packages/directives/src/index.ts`
- `packages/directives/src/focus/index.ts`
- `packages/directives/src/click-outside/index.ts`
- `packages/directives/src/ripple/index.ts`
- `packages/directives/src/ripple/ripple.ts`
- `packages/directives/src/ripple/style.ts`
