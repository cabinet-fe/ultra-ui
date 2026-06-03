# UCollapse / UCollapseItem — 折叠面板

> `import type { CollapseProps, CollapseItemProps, CollapseEmits, CollapseValue, CollapseModelValue } from '@veltra/desktop'`

> 类型：`../../../generated/types/collapse.ts`

## Import

```ts
// UCollapse、UCollapseItem 由 Vite 自动导入，无需手动 import
```

## 关联类型

```ts
type CollapseValue = string | number
type CollapseModelValue = CollapseValue | CollapseValue[]
```

`accordion=true` 时 `modelValue` 应为单值，关闭时回写空数组 `[]`；`accordion=false` 时为数组（也兼容传入单值，组件内部自动包装为数组）。

> 示例见 [examples.md](./examples.md)
