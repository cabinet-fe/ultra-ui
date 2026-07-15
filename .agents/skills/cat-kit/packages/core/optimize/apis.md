# 执行控制 — API

```ts
declare function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay?: number,
  immediate?: boolean
): (this: any, ...args: T) => void

declare function throttle<T extends any[], R>(
  fn: (...args: T) => R,
  delay?: number,
  cb?: (v: R) => void
): (this: any, ...args: T) => R

declare function sleep(ms: number): Promise<void>

declare function parallel<T>(
  tasks: Array<() => Promise<T> | T>,
  options?: { concurrency?: number }
): Promise<T[]>

declare function safeRun<T>(fn: () => T): T | undefined
declare function safeRun<T>(fn: () => T, defaultVal: T): T
```
