import { type Ref, type ShallowRef, onBeforeUnmount, watch } from 'vue'

export type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ResizeObserverOptions {
  targets: RefElement | RefElement[]
  onResize: ResizeObserverCallback
  when?: () => boolean
}

export type ResizeObserverReturn = { disconnect: () => void }

function unobserve(targets: RefElement | RefElement[], observer?: ResizeObserver) {
  if (Array.isArray(targets)) {
    return targets.forEach((target) => unobserve(target, observer))
  }
  if (!targets.value || !observer) return
  observer.unobserve(targets.value)
  observer.disconnect()
}

export function useResizeObserver(options: ResizeObserverOptions): ResizeObserverReturn {
  const { targets, onResize } = options

  let observer: ResizeObserver | undefined

  if (Array.isArray(targets)) {
    watch(
      targets,
      (val, oldVal) => {
        oldVal.forEach((target) => {
          target && observer?.unobserve(target)
        })

        if (!observer && !!val.length) {
          observer = new ResizeObserver(onResize)
        }

        val.forEach((target) => {
          target && observer?.observe(target)
        })
      },
      { immediate: true }
    )
  } else {
    watch(
      targets,
      (val, oldVal) => {
        oldVal && observer?.unobserve(oldVal)
        if (!observer && val) {
          observer = new ResizeObserver(onResize)
        }
        val && observer?.observe(val)
      },
      { immediate: true }
    )
  }

  onBeforeUnmount(() => {
    unobserve(targets, observer)
    observer = undefined
  })

  return {
    disconnect() {
      unobserve(targets, observer)
      observer = undefined
    }
  }
}

/**
 * 监听元素尺寸变化
 */
export function useObserverCallback(): {
  observeEl: <El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) => void
  unobserveEl: (el: HTMLElement) => void
} {
  const observerElMap = new Map<HTMLElement, Function>()

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement
      if (!target.dataset.ob) {
        target.dataset.ob = 'true'
        return
      }
      const fn = observerElMap.get(target)

      fn?.(entry)
    })
  })

  function observeEl<El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) {
    observer.observe(el)
    observerElMap.set(el, cb)
  }

  function unobserveEl(el: HTMLElement) {
    observer.unobserve(el)
    delete el.dataset.ob
    observerElMap.delete(el)
  }

  onBeforeUnmount(() => {
    observerElMap.forEach((_, el) => {
      observer.unobserve(el)
    })
    observerElMap.clear()
    observer.disconnect()
  })

  return { observeEl, unobserveEl }
}
