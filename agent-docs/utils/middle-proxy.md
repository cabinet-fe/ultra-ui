---
title: middleProxy
description: 介于 reactive 与 shallowReactive 之间的嵌套对象代理
---

`middleProxy(o, handler?)` 对普通对象做 Proxy：嵌套普通对象会递归套同一套代理（`Date` / `RegExp` 不套）。同一子对象经 `WeakMap` 复用代理实例。

`handler`：

| 钩子              | 时机                                   |
| ----------------- | -------------------------------------- |
| `set(field, val)` | 赋值时；嵌套字段名为点路径，如 `'a.b'` |
| `get(field)`      | 读取当前层字段名（不含父路径）         |
| `changed(fields)` | 微任务里批量回调本次所有变更字段       |

```ts
import { middleProxy } from '@veltra/utils'

const model = middleProxy(
  { user: { name: '' } },
  {
    set(field, val) {
      console.log(field, val)
    },
    changed(fields) {
      console.log(fields)
    }
  }
)

model.user.name = 'ada'
```
