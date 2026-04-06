# core — Observable 观察者模式

```typescript
import { Observable } from '@cat-kit/core'

const store = new Observable({ count: 0, name: 'cat' })

const stop = store.observe(['count'], ([c]) => console.log(c), {
  immediate?: boolean,
  sync?: boolean,
  once?: boolean
})

store.state.count = 1          // proxy 触发
store.setState({ count: 2 })   // 批量更新
store.getState()               // 浅拷贝
store.trigger('count')         // 手动触发
store.destroyAll()             // 移除全部
stop()                         // 移除单个
```

只订阅必要字段；批量修改优先用 `setState`。
