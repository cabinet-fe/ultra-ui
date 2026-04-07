import { Forest } from 'cat-kit'
import { getChainValue } from '@ultra-ui/utils'
import type { CascadeNode, CascadeProps } from '@ultra-ui/desktop/types'
import {
  shallowRef,
  triggerRef,
  watchEffect,
  type ComputedRef,
  type ShallowRef
} from 'vue'

interface DataMapOptions {
  props: CascadeProps
  forest: ComputedRef<Forest<CascadeNode>>
}

/** 数据映射相关逻辑 */
interface UseDataMapReturned {
  dataMap: ShallowRef<Map<string, CascadeNode>>
}

export function useDataMap(options: DataMapOptions): UseDataMapReturned {
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
