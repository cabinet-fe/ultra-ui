---
name: veltra-utils
description: 面向 `@veltra/utils` 的底层工具、共享常量与类型文档技能。用于追踪 BEM/class-name、DOM helper、表单校验、响应式辅助、共享类型与子路径导出，或在修改 `@veltra/compositions`、`@veltra/directives`、`@veltra/desktop` 时需要回到基础能力层定位实现与边界时使用。
---

# Veltra Utils

## 先判断任务落点

优先在这些场景使用本 skill：

- 修改或排查 `@veltra/utils` 的 public export、shared constant、type export
- 需要理解 `bem()`、`bem.is()`、`FORM_EMPTY_CONTENT`、`Validator`、DOM helper 的真实行为
- 在上层包里遇到基础类型或 helper 的来源不明，需要追溯到 `packages/utils/src`

如果任务主要是 Sass token、主题注入或 `pkg:@veltra/styles/...`，改用 `veltra-styles`。

## 按需读取 references

- 先读 [references/source-discovery.md](references/source-discovery.md)：当 skill 被复制到其它项目，需要先定位 `@veltra/utils` 的源码、声明文件或安装产物时
- 先读 [references/api-map.md](references/api-map.md)：需要知道导出面、子路径、源码入口时
- 再读 [references/patterns.md](references/patterns.md)：需要扩展 helper、保持依赖边界、复用现有模式时

## 遵守这些约束

- 把 `@veltra/utils` 视为最低层 workspace 包，不要反向依赖 `@veltra/compositions`、`@veltra/styles`、`@veltra/desktop`
- 把样式系统留在 `@veltra/styles`；`utils` 只放 TS helper、shared constant、type
- 保持导出可 tree-shake，避免无必要副作用
- 新增能力时先复用现有目录语义：`dom/`、`helper/`、`form/`、`reactive/`、`shared/`、`types/`

## 快速源码锚点

- `packages/utils/src/index.ts`
- `packages/utils/src/dom/class-name.ts`
- `packages/utils/src/helper/make-bem.ts`
- `packages/utils/src/form/validate.ts`
- `packages/utils/src/types/component-common.ts`
- `packages/utils/src/shared/constants.ts`
