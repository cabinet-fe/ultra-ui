/**
 * Chrome 103 缺失 API 的手写 shim（cooking spec 决策 4）。
 * 仅供 import 副作用：须先于 pdfjs-dist 代码求值（主线程 chunk 顶部 / worker wrapper 首条 import）。
 * 各 API 已存在时不覆盖，可安全重复引入。
 */

// Promise.withResolvers：Chrome 119 引入
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// Promise.try：Chrome 134 引入；回调以 undefined this 同步调用，异常转为 rejection
if (typeof Promise.try !== 'function') {
  Promise.try = function try_<T, Args extends unknown[]>(
    this: PromiseConstructor,
    callbackfn: (...args: Args) => T | PromiseLike<T>,
    ...args: Args
  ): Promise<Awaited<T>> {
    return new this<Awaited<T>>((resolve) => {
      resolve(callbackfn(...args) as Awaited<T>)
    })
  }
}

// Set.prototype.intersection：Chrome 122 引入，返回新 Set
if (typeof Set.prototype.intersection !== 'function') {
  Set.prototype.intersection = function intersection<T, U>(
    this: Set<T>,
    other: ReadonlySetLike<U>
  ): Set<T> {
    const result = new Set<T>()
    for (const value of this) {
      if (other.has(value as unknown as U)) result.add(value)
    }
    return result
  }
}
