# useComponentProps - 通用属性合并

## 示例

见 `./examples.md`

## 类型

```ts
import type { Component, MaybeRef } from 'vue'

function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T & Record<string, any>>
): Component
```

## 说明

- 返回一个组件，把通用属性合并到默认插槽的子节点；子节点已显式定义的属性优先。
- 可通过组件自身 `tag` prop 包一层 HTML 标签；`attrs` 中不在 common props 内的键会落到该标签上。
- 适用于少量复合组件（如按钮组透传公共 props）。
