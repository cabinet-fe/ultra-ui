import { type Ref, type ShallowRef, onBeforeUnmount, watch } from 'vue'

export type RefElement =
  | ShallowRef<HTMLElement | undefined>
  | Ref<HTMLElement | undefined>

interface ResizeObserverOptions {
  /** 目标节点 */
  targets: RefElement | RefElement[]
  /** resize事件 */
  onResize: ResizeObserverCallback
  /** 指定观察条件 */
  when?: () => boolean
}

/** 监听器 */
export type ResizeObserverReturn = {
  /** 终止监听 */
  disconnect: () => void
}

function unobserve(
  targets: RefElement | RefElement[],
  observer: ResizeObserver
) {
  if (Array.isArray(targets)) {
    return targets.forEach(target => unobserve(target, observer))
  }
  if (!targets.value) return
  observer.unobserve(targets.value)
}

/**
 * 监听元素尺寸变更
 * @param options 选项
 */
export function useResizeObserver(
  options: ResizeObserverOptions
): ResizeObserverReturn {
  const { targets, onResize } = options

  let observer: ResizeObserver | undefined

  if (Array.isArray(targets)) {
    watch(
      targets,
      (val, oldVal) => {
        if (!observer && !!val.length ) {
          observer = new ResizeObserver(onResize)
        }
        oldVal.length &&
          oldVal.forEach(target => {
            target && observer?.unobserve(target)
          })
        val.length &&
          val.forEach(target => {
            target && observer?.observe(target)
          })
      },
      { immediate: true }
    )
  } else {
    watch(
      targets,
      (val, oldVal) => {
        if (!observer && val) {
          observer = new ResizeObserver(onResize)
        }
        oldVal && observer?.unobserve(oldVal)
        val && observer?.observe(val)
      },
      { immediate: true }
    )
  }

  onBeforeUnmount(() => {
    observer && unobserve(targets, observer)
    observer?.disconnect()
    observer = undefined
  })

  return {
    disconnect() {
      observer && unobserve(targets, observer)
      observer?.disconnect()
    }
  }
}
