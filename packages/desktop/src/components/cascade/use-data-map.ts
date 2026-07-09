import { Forest, o } from '@cat-kit/core'
import { fieldKey } from '@veltra/utils'
import { shallowRef, triggerRef, watchEffect, type ComputedRef, type ShallowRef } from 'vue'

import type { CascadeNode, CascadeProps } from '../../types'

interface DataMapOptions {
  props: CascadeProps
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
}

/** 数据映射相关逻辑 */
interface UseDataMapReturned {
  dataMap: ShallowRef<Map<string, CascadeNode>>
}

export function useDataMap(options: DataMapOptions): UseDataMapReturned {
  const { props, forest } = options
  const dataMap = shallowRef(new Map<string, CascadeNode>())

  watchEffect(() => {
    const valueKey = fieldKey(props.valueKey, 'value')

    dataMap.value.clear()

    forest.value.dfs((node) => {
      const value = o(node.data).get(valueKey)
      if (value !== null && value !== undefined) {
        dataMap.value.set(value, node)
      }
    })

    triggerRef(dataMap)
  })

  return { dataMap }
}
