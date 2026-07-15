# 可观察状态 — API

```ts
interface ObserveOptions {
  immediate?: boolean
  once?: boolean
  sync?: boolean
}

declare class Observable<S extends object, K extends keyof S = keyof S> {
  readonly state: S
  constructor(data: S)
  trigger(prop: string | symbol): void
  observe<const P extends K[]>(
    props: P,
    callback: (values: { [key in keyof P]: S[P[key]] }) => void,
    options?: ObserveOptions
  ): () => void
  getState(): S
  setState(state: Partial<S>): Observable<S, K>
  unobserveHandler(handler: PropHandler): void
  unobserve<const P extends K[]>(props: P, handler?: PropHandler): void
  destroyAll(): void
}
```

类型导出：`ObserveOptions`、`PropHandler`。
