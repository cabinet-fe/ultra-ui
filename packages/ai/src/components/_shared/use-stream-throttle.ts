import { throttle } from '@cat-kit/core'
import { ref, watch, type Ref } from 'vue'

/** 流式输出节流间隔（ms）：抑制高速模型的逐 token 高频重排与抖动 */
export const STREAM_THROTTLE_MS = 50

/**
 * 流式输出节流：
 * - active 为 true 时，通过 @cat-kit/core 的 throttle 节流高频增量更新；
 * - active 为 false（流式结束/历史消息）或值为空时，立即同步最新值。
 */
export function useStreamThrottle<T>(
  source: () => T,
  active: () => boolean,
  delay = STREAM_THROTTLE_MS
): Readonly<Ref<T>> {
  const state = ref(source()) as Ref<T>
  const update = throttle((val: T) => {
    state.value = val
  }, delay)

  watch(
    [source, active],
    ([val, isActive]) => {
      if (!isActive || !val) {
        state.value = val
        return
      }
      update(val)
    },
    { immediate: true }
  )

  return state
}
