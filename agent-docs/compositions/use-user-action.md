---
title: "useUserAction - 阻断数据回流与用户主动操作标记"
description: "Vue 组合式函数，用于解决组件内部 emit 触发外部 props 变更、props 回流又触发内部 watch 重复更新的双向绑定死循环与抖动问题，在用户主动操作执行窗口内自动屏蔽 watch 回显，保证交互流畅稳定"
keywords: ["useUserAction", "@veltra/compositions", "use-user-action", "阻断数据回流与用户主动操作标记"]
aliases: ["use-user-action", "useUserAction", "阻断数据回流与用户主动操作标记"]
---
## 快速上手

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

