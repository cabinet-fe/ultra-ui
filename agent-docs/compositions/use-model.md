---
title: "useModel - 双向绑定状态同步与受控/非受控模式"
description: "Vue 组合式函数，用于统一构造组件 modelValue / v-model 双向绑定状态，支持本地缓存响应态（local: true）与纯代理受控模式（local: false），自动触发 update:modelValue 事件并深度同步外部 props 回显"
keywords:
  - useModel
  - @veltra/compositions
  - use-model
  - 双向绑定状态同步与受控
  - 非受控模式
aliases: ["use-model", "useModel"]
---

## 快速上手

`useModel` 根据 `props` + `emit` 构造可读写的模型值，默认绑定 `modelValue` / `update:modelValue`。`local` 默认为 `true`：内部持有副本，赋值时既 emit 又更新本地，并 watch props 回写。`local: false` 是纯代理，读 props、写只 emit。

```ts
import { useModel } from '@veltra/compositions'

const model = useModel({ props, emit, local: true })

const visible = useModel({ props, emit, propName: 'visible', local: false, defaultValue: false })

model.value = 'next'
```

选项：

| 字段             | 说明                                                     |
| ---------------- | -------------------------------------------------------- |
| `props` / `emit` | 组件的 props 与 emit                                     |
| `propName`       | 绑定名，默认 `'modelValue'`，事件为 `update:${propName}` |
| `local`          | `boolean` 或 `() => boolean`；函数在每次 set 时求值      |
| `defaultValue`   | props 为空时的回退                                       |
| `shallow`        | 仅 `local` 为真时生效，内部用 `shallowRef`，默认 `false` |

返回值带 `__v_isRef`，可按 ref 使用 `.value`。在 `UForm` 场景里控件仍须走 `field`，不要对同一控件再写 `v-model`。
