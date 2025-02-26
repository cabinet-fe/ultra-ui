import { Forest, getChainValue } from 'cat-kit/fe'
import type { CascadeNode, CascadeProps } from '@ui/types'
import { shallowRef, triggerRef, watchEffect, type ComputedRef } from 'vue'

interface DataMapOptions {
  props: CascadeProps
  forest: ComputedRef<Forest<CascadeNode>>
}

/** 数据映射相关逻辑 */
export function useDataMap(options: DataMapOptions) {
  const { props, forest } = options
  const dataMap = shallowRef(new Map<string, CascadeNode>())

  watchEffect(() => {
    const { valueKey } = props

    dataMap.value.clear()

    forest.value.dft(node => {
      const value = getChainValue(node.data, valueKey!)
      if (value !== null && value !== undefined) {
        dataMap.value.set(value, node)
      }
    })

    triggerRef(dataMap)
  })

  return { dataMap }
}
