import { Tree, getChainValue } from 'cat-kit/fe'
import type { CascadeProps } from '@ui/types'
import { shallowRef, triggerRef, watchEffect } from 'vue'

/** 数据映射相关逻辑 */
export function useDataMap(props: CascadeProps) {
  const dataMap = shallowRef(new Map<string, Record<string, any>>())

  watchEffect(() => {
    const { valueKey, data } = props

    dataMap.value.clear()

    data?.forEach(item => {
      Tree.dft(item, item => {
        const value = getChainValue(item, valueKey!)
        if (value !== null && value !== undefined) {
          dataMap.value.set(value, item)
        }
      })
    })

    triggerRef(dataMap)
  })

  return { dataMap }
}
