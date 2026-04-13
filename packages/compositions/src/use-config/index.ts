import { isObj } from '@cat-kit/core'
import type { ComponentSize } from '@veltra/utils'
import { reactive, readonly, watch } from 'vue'

interface State {
  /** 是否开启动画，机器老可以关闭动画来获得性能 */
  animation: boolean
  /** 组件尺寸大小 */
  size: ComponentSize
  /** 表单 */
  form: {
    /** 标签宽度 */
    labelWidth?: number | number
  }
  paginator: { pageSize: number; pageSizeOptions: number[] }
}

const state = reactive<State>({
  animation: true,
  size: 'default',
  form: { labelWidth: 80 },
  paginator: { pageSize: 40, pageSizeOptions: [40, 100, 200, 500, 1000] }
})

export function setDocumentSize(size: ComponentSize, oldSize?: ComponentSize): void {
  if (typeof document === 'undefined') return
  if (oldSize) {
    document.documentElement.classList.remove(oldSize)
  }
  document.documentElement.classList.add(size)
}

let stopDocumentSizeSync: (() => void) | null = null

function ensureDocumentSizeSync(): void {
  if (stopDocumentSizeSync) return
  if (typeof document === 'undefined') return

  stopDocumentSizeSync = watch(
    () => state.size,
    (size, oldSize) => setDocumentSize(size, oldSize)
  )
}

function deepSet(original: Record<string, any>, extend: Record<string, any>) {
  Object.keys(extend).forEach((key) => {
    const val = original[key]
    const targetVal = extend[key]
    if (isObj(val)) {
      if (isObj(targetVal)) {
        deepSet(val, targetVal)
      } else {
        console.warn(`extend['${key}']应该是一个对象`)
      }
    } else {
      original[key] = targetVal
    }
  })
}

export function useConfig(): {
  config: Readonly<State>
  setConfig: (conf: Partial<State>) => void
} {
  ensureDocumentSizeSync()
  return {
    /** 全局配置 */
    config: readonly(state) as Readonly<State>,
    /**
     * 设置全局配置项
     * @param conf
     */
    setConfig(conf: Partial<State>) {
      deepSet(state, conf)
    }
  }
}
