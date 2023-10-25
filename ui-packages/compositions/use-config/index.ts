import { reactive } from 'vue'
import type { ComponentSize } from '@ui/types/component-common'

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
  return state
}
