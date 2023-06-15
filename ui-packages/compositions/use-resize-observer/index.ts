import { type Ref, type ShallowRef, onBeforeUnmount, watch } from 'vue'

interface ResizeObserverOptions {
  /** 目标节点 */
  target: ShallowRef<HTMLElement | undefined> | Ref<HTMLElement | undefined>
  /** resize事件 */
  onResize: ResizeObserverCallback
}

type ResizeObserverReturn = {
  /** 终止监听 */
  disconnect: () => void
}

/**
 * 监听元素尺寸变更
 * @param options 选项
 */
export function useResizeObserver(
  options: ResizeObserverOptions
): ResizeObserverReturn {
  const { target, onResize } = options

  const observer = new ResizeObserver(onResize)

  watch(
    target,
    (val, oldVal) => {
      oldVal && observer.unobserve(oldVal)
      val && observer.observe(val)
    },
    {
      immediate: true
    }
  )

  onBeforeUnmount(() => {
    if (!target.value) return
    observer.unobserve(target.value)
    observer.disconnect()
  })

  return {
    disconnect() {
      observer.disconnect()
    }
  }
}
