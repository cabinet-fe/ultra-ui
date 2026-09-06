---
title: createToggle
description: 创建布尔开关状态与切换函数
---

`createToggle(initial?, onChange?)` 返回 `[state, toggle]`。`state` 是普通对象 `{ value: boolean }`（不是 Vue ref），`initial` 默认 `false`。`onChange` 在值被 `toggle` 更新后调用。

`toggle` 入参：

- `boolean`：直接设为该值
- `(active: boolean) => boolean`：用当前值算出下一值
- `(active: boolean) => Promise<boolean>`：Promise 兑现后再走一遍 `toggle`

不要直接改 `state.value`，否则不会触发 `onChange`。

```ts
import { createToggle } from '@veltra/utils'

const [state, toggle] = createToggle(false, (active) => {
  console.log(active)
})

toggle(true)
toggle((active) => !active)
console.log(state.value)
```
