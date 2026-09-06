---
title: "shallowComputed - 基于 shallowRef 的浅层计算属性"
description: "Vue 响应式优化工具函数，使用 shallowRef 缓存 getter 计算结果，只在根引用发生变化时触发下游响应式更新，避免大型深层复杂对象深度比对引起的重复渲染"
keywords:
  - shallowComputed
  - @veltra/utils
  - shallow-computed
  - 基于
  - 的浅层计算属性
aliases: ["shallow-computed", "shallowComputed"]
---
## 快速上手

`shallowComputed(getter)` 立刻执行 `getter` 写入 `shallowRef`，再用 `watch(getter)` 同步后续结果。返回 `ShallowRef<T>`，不是 Vue `computed`：不懒求值、没有 `computed` 的 stop / debug 接口，赋值替换整个 `.value`（浅层）。

```ts
import { shallowComputed } from '@veltra/utils'
import { ref } from 'vue'

const source = ref({ id: 1, nested: { n: 0 } })
const snapshot = shallowComputed(() => source.value)

snapshot.value // 与 getter 当前返回值相同的对象引用
```

