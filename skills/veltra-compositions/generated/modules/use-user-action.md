# use-user-action

```typescript
import { nextTick } from 'vue'

export type UserAction = <T extends (...args: any[]) => void | Promise<void>>(
  fn: T
) => (...args: Parameters<T>) => Promise<void>

export interface UserActionResult {
  isUserActive: () => boolean
  userAction: UserAction
}

/**
 * 创建用户活动
 * @description
 * 解决"组件内部 emit 更新 → 外部 props 回传 → 监听 props 的副作用再次触发
 * 内部状态变更"的循环更新问题。典型搭配：
 *
 * ```ts
 * const { userAction, isUserActive } = useUserAction()
 *
 * // 将函数标记为一个用户动作
 * const handleSelect = userAction((date: Dater) => {
 *   currentDate.value = date
 *   emit('update:modelValue', date.format(fmt))
 * })
 *
 * // modelValue 回显：用户活动期间跳过
 * watch(() => props.modelValue, (v) => {
 *   if (isUserActive()) return
 *   currentDate.value = v ? date(v) : undefined
 * })
 * ```
 */
export function useUserAction(): UserActionResult {
  let actionCount = 0
  const isUserActive = () => {
    return actionCount > 0
  }

  const userAction: UserAction = (fn) => {
    return async (...args) => {
      actionCount++

      try {
        await fn(...args)
      } catch (error) {
        console.error(error)
      }
      await nextTick()

      actionCount--
    }
  }

  return { isUserActive, userAction }
}
```
