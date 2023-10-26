import { reactive, readonly } from 'vue'
import type { ComponentSize } from '@ui/types/component-common'
import { obj } from 'cat-kit/fe'

interface State {
  /** 是否开启动画，机器老可以关闭动画来获得性能 */
  animation: boolean
  /** 组件尺寸大小 */
  size: ComponentSize
}

const state = reactive<State>({
  animation: true,
  size: 'default'
})

export function useConfig() {
  return {
    /** 全局配置 */
    config: readonly(state),
    /**
     * 设置全局配置项
     * @param conf
     */
    setConfig(conf: Partial<State>) {
      obj(state).extend(conf)
    }
  }
}
