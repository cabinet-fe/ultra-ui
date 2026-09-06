---
title: useFallbackProps 与 useFormFallbackProps 多级回退
description: 按从右到左的 props 列表解析属性，再回退到 useConfig 与默认值
---

`useFallbackProps` 按「列表从右到左第一个非 `undefined` → `useConfig()` 同名顶层键 → 传入的默认值」解析一组属性，每个键返回 `ComputedRef`。`useFormFallbackProps` 是表单控件常用的封装，默认回退 `size: 'default'`、`disabled: false`、`readonly: false`。

```ts
import { useFallbackProps, useFormFallbackProps } from '@veltra/compositions'
import type { ComponentSize } from '@veltra/utils'

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const { size: formSize, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props]
)
```

`propsList` 最右边优先级最高。典型链是组件自身 props 盖过表单上下文，再盖过全局 `useConfig().config.size`。

第二参可只覆盖部分表单字段：

```ts
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'small',
  disabled: false
})
```

未出现在第二参里的键不会进入返回对象。`disabled` / `readonly` 不在 `useConfig` 的全局状态里，只回退到默认值。
