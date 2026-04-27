# core — optimize

性能优化工具：防抖、节流、并发控制、安全执行。

## 防抖与节流

### `debounce`

```ts
function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay?: number,
  immediate?: boolean
): (...args: T) => void
```

延迟执行函数，在连续调用时取消之前的调用。

- **`delay`**：延迟时间（ms），默认 `0`
- **`immediate`**：首次调用立即执行，默认 `true`
- **注意**：返回的 wrapper 只执行最后一次调用

```ts
const handleInput = debounce((e: Event) => {
  fetchSuggestions(e.target.value)
}, 300)
```

### `throttle`

```ts
function throttle<T extends any[], R>(
  fn: (...args: T) => R,
  delay?: number,
  cb?: (v: R) => void
): (...args: T) => R
```

节流执行函数，在 `delay` 毫秒内最多执行一次。

- **`delay`**：间隔时间（ms），默认 `0`
- **`cb`**：可选回调，在节流窗口内收到新调用时触发，可获取 fn 的返回值

```ts
const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)
```

## 异步

### `sleep`

```ts
function sleep(ms: number): Promise<void>
```

异步延迟，返回在指定 ms 后 resolve 的 Promise。

```ts
await sleep(1000) // 等待 1 秒
```

## 并发控制

### `parallel`

```ts
function parallel<T>(
  tasks: ReadonlyArray<() => T | Promise<T>>,
  options?: ParallelOptions
): Promise<T[]>
```

并发执行任务列表，保持结果顺序与 tasks 一致。

- **`options.concurrency`**：最大并发数，默认为 `tasks.length`
- 任一 task reject 则整体 reject

```ts
const results = await parallel(
  [() => fetch('/api/a'), () => fetch('/api/b'), () => fetch('/api/c')],
  { concurrency: 2 } // 最多同时 2 个请求
)
```

## 安全执行

### `safeRun`

```ts
function safeRun<T>(fn: () => T): T | undefined
function safeRun<T>(fn: () => T, defaultVal: T): T
```

try-catch 包裹执行，出错时不抛出。

- 不传 `defaultVal`：出错返回 `undefined`
- 传入 `defaultVal`：出错返回默认值

```ts
const obj = safeRun(() => JSON.parse(maybeInvalidJson), {})
```

> 类型签名：`../../generated/core/optimize/`
