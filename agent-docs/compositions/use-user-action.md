---
title: useUserAction 阻断 model 回流
description: 把函数标记为用户动作，动作窗口内跳过 props 回显 watch
---

`useUserAction` 用来切断「内部 emit → 外部 props 回传 → watch 再改内部状态」的循环。`userAction(fn)` 返回异步包装：执行期间 `isUserActive()` 为 `true`，`await fn(...)` 后再 `await nextTick()`，然后结束窗口。

```ts
import { watch } from 'vue'
import { useUserAction } from '@veltra/compositions'

const { userAction, isUserActive } = useUserAction()

const handleSelect = userAction((value: string) => {
  inner.value = value
  emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (v) => {
    if (isUserActive()) return
    inner.value = v
  }
)
```

类型 `UserAction`、`UserActionResult` 从 `@veltra/compositions` 导出。包装后的函数始终返回 `Promise<void>`；`fn` 抛错会被 `console.error` 后仍结束动作窗口。
