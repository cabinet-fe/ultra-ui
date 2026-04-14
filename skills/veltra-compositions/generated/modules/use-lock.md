# use-lock

```typescript
import { nextTick } from 'vue'

type Update = (fn: Function) => any
type Lock = (fn: Function) => Promise<void>

export interface Updater {
  /**
   * 更新
   * @description 在非锁定时执行传入的函数
   */
  update: Update
  /**
   * 更新并锁定
   * @description 执行传入的函数，并锁定更新操作，直到函数执行完成
   */
  updateAndLock: Lock
}

/**
 * 数据更新锁
 * @description
 * 更新锁主要用于防止组件数据更新时，循环触发更新。
 *
 * @returns 该函数返回两个函数：
 * 1. update: 更新函数，在非锁定时执行传入的函数
 * 2. lock: 锁定函数，执行时会锁定更新操作，直到锁定操作结束
 */
export function useUpdateLock(): Updater {
  let lockedCount = 0

  function update(fn: Function) {
    if (lockedCount > 0) return
    return fn()
  }

  async function updateAndLock(fn: Function) {
    lockedCount++

    try {
      await fn()
    } catch (error) {
      console.error(error)
    }
    await nextTick()

    lockedCount--
  }

  return { updateAndLock, update }
}
```
