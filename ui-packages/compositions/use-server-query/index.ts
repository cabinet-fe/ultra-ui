import { PropsWithServerQuery } from '@ui/shared'
import { reactive } from 'vue'

interface Config<T> {
  /** 初始值 */
  initial?: T
  /** 是否浅响应, 初始值被设置为复杂类型时使用浅响应 */
  shallow?: boolean
}

export function useServerQuery<T>(
  props: PropsWithServerQuery,
  config?: Config<T>
) {
  // const { api, query } = props

  const result = reactive({})

  const getData = () => {}

  return [result, getData]
}
