# useUserAction - 用户动作期阻断回流

## 示例

见 `./examples.md`

## 类型

```ts
type UserAction = <T extends (...args: any[]) => void | Promise<void>>(
  fn: T
) => (...args: Parameters<T>) => Promise<void>

interface UserActionResult {
  isUserActive: () => boolean
  userAction: UserAction
}

function useUserAction(): UserActionResult
```

## 说明

- 解决 emit → props 回灌 → watch 副作用循环更新。
- `userAction(fn)` 返回异步包装：进入时 `actionCount++`，`await fn(...)` 后再 `await nextTick()`，最后 `--`。
- 在监听 props 回显时调用 `isUserActive()`，用户动作窗口内直接 return。
