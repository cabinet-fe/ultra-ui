# core — 可观察状态

## 何时使用

对普通对象做浅层属性订阅（非深层 Proxy 框架）。

## 推荐公开 API

`Observable`

```ts
import { Observable } from '@cat-kit/core'

const store = new Observable({ count: 0 })
const stop = store.observe(['count'], ([count]) => console.log(count))
store.state.count = 1
stop()
```

详情见 [apis.md](apis.md)。

## 约束

- 仅观察顶层赋值
- 默认回调进微任务；`sync: true` 同步执行
- 回调参数为被观察属性值的位置元组
- `immediate` 同步触发一次，且不消耗 `once`

## 类型入口

[observer.d.ts](../../../generated/core/pattern/observer.d.ts)
