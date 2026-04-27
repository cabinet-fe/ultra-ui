# core — pattern

设计模式实现。当前提供 Observable 观察者模式。

## Observable

```ts
class Observable<S extends object, K extends keyof S>
```

基于 Proxy 拦截的可观察状态容器。当观察的属性发生变化时，自动通知注册的回调。

**构造器**：

```ts
const obs = new Observable({ count: 0, name: 'hello' })
```

**属性**：

| 属性 | 说明 |
|------|------|
| `.state` | 被 Proxy 包装的可观察状态对象，直接赋值属性即可触发通知 |

**方法**：

### `observe`

```ts
.observe<P extends K[]>(
  props: P,
  callback: (values: { [key in keyof P]: S[P[key]] }) => void,
  options?: ObserveOptions
): () => void
```

观察指定属性的变化。返回取消观察的函数。

Options：
- `immediate?`：注册后立即执行一次回调（以当前值），默认 `false`
- `once?`：只触发一次，触发后自动取消观察，默认 `false`
- `sync?`：同步执行回调，默认 `false`（异步通过微任务队列批量执行）

```ts
const unsub = obs.observe(['count', 'name'], ({ count, name }) => {
  console.log(`count: ${count}, name: ${name}`)
}, { immediate: true })

obs.state.count = 1    // 触发回调: count: 1, name: hello
obs.state.name = 'bye' // 触发回调: count: 1, name: bye
obs.state.count = 2    // 触发回调: count: 2, name: bye

unsub() // 取消观察
```

### `getState` / `setState`

```ts
.getState(): S
.setState(state: Partial<S>): Observable<S, K>
```

批量读写状态。`setState` 内部通过 `Object.assign` 合并，一次赋值多个属性只触发一次回调。

```ts
obs.setState({ count: 5, name: 'updated' }) // 触发一次回调
```

### `unobserve` / `destroyAll`

```ts
.unobserve(props: P, handler?: PropHandler): void
.destroyAll(): void
```

`unobserve` 取消特定属性的特定 handler；不传 handler 则取消该属性的所有观察。`destroyAll` 清空所有 handler 和待处理的微任务。

**使用模式**：

```ts
import { Observable } from '@cat-kit/core'

const store = new Observable({ user: null, loading: false })

// React hook 风格
const useStore = () => {
  const [state, setState] = useState(store.getState())

  useEffect(() => {
    return store.observe(['user', 'loading'], (vals) => {
      setState(prev => ({ ...prev, ...vals }))
    })
  }, [])

  return state
}
```

**注意事项**：
- async callback 通过微任务队列批量执行
- 仅当被观察属性的值真正变化时才触发（Proxy `set` 拦截比较新旧值）
- `sync: true` 时立即同步执行回调（不经过微任务队列）

> 类型签名：`../../generated/core/pattern/observer.d.ts`
