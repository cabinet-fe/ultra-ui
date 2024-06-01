import { reactive, readonly, watch } from 'vue'
import type { ComponentSize } from '@ui/types/component-common'
import { isObj } from 'cat-kit/fe'

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
  paginator: {
    pageSize: number
    pageSizeOptions: number[]
  }
}

const state = reactive<State>({
  animation: true,
  size: 'default',
  form: {
    labelWidth: 80
  },
  paginator: {
    pageSize: 40,
    pageSizeOptions: [40, 100, 200, 500, 1000]
  }
})

watch(
  () => state.size,
  (size, oldSize) => {
    oldSize && document.documentElement.classList.remove(oldSize)
    document.documentElement.classList.add(size)
  },
  { immediate: true }
)

function deepSet(original: Record<string, any>, extend: Record<string, any>) {
  Object.keys(extend).forEach(key => {
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

export function useConfig() {
  return {
    /** 全局配置 */
    config: readonly(state),
    /**
     * 设置全局配置项
     * @param conf
     */
    setConfig(conf: Partial<State>) {
      deepSet(state, conf)
    }
  }
}
