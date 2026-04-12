---
name: veltra-compositions
description: 面向 `@veltra/compositions` 的 Vue 3 composition 文档技能。用于理解或修改 `useConfig`、`useModel`、`useFormComponent`、`useFormFallbackProps`、`usePop`、`useVirtual`、`useTransition` 等通用组合式逻辑，或在 `@veltra/desktop` 组件中追踪共享状态、表单上下文、浮层定位与虚拟列表行为时使用。
---

# Veltra Compositions

## 先选参考面

- 需要先在消费项目里定位 `@veltra/compositions` 的源码、类型声明或安装产物时，读取 [references/source-discovery.md](references/source-discovery.md)
- 需要查模块清单和源码入口时，读取 [references/api-map.md](references/api-map.md)
- 需要套现有模式写新 hook 或排查交互链路时，读取 [references/patterns.md](references/patterns.md)

## 用本 skill 时优先记住

- 这是 Vue 3 组合式逻辑层，不负责样式资源
- 公共逻辑优先沉淀在这里，而不是复制进单个组件目录
- 依赖边界是 `vue`、`@cat-kit/core`、`@veltra/utils`，不要把 `desktop` 组件语义反向塞进来
- 表单、浮层、虚拟列表是最常见复用场景

## 快速源码锚点

- `packages/compositions/src/index.ts`
- `packages/compositions/src/use-config/index.ts`
- `packages/compositions/src/use-model/index.ts`
- `packages/compositions/src/use-form-component/index.ts`
- `packages/compositions/src/use-fallback-props/index.ts`
- `packages/compositions/src/use-pop/index.ts`
- `packages/compositions/src/use-virtual/index.ts`
