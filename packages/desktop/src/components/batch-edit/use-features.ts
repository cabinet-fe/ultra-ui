import { computed } from 'vue'

import type { BatchEditFeature, BatchEditProps, TableRow } from '../../types'

interface Options {
  props: BatchEditProps
}
export function useFeatures(options: Options) {
  const { props } = options
  const staticFeatures = computed(() => {
    const { features } = props

    if (Array.isArray(features)) {
      return new Set(features)
    }

    const defaultFeatures = new Set<BatchEditFeature>(['create', 'delete', 'update', 'createChild'])

    if (!features) {
      return defaultFeatures
    }

    // 函数与 false 的特性视为关闭；显式 true 视为开启（即便不在默认集合内）
    Object.entries(features).forEach(([key, value]) => {
      const k = key as BatchEditFeature
      if (typeof value === 'function' || value === false) {
        defaultFeatures.delete(k)
      } else if (value === true) {
        defaultFeatures.add(k)
      }
    })
    return defaultFeatures
  })

  const dynamicFeatures = computed<
    Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
  >(() => {
    const { features } = props
    if (!Array.isArray(features) && typeof features === 'object') {
      const ret = Object.entries(features)
        .filter(([, value]) => {
          return typeof value === 'function'
        })
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value
            return acc
          },
          {} as Record<BatchEditFeature, (row?: TableRow) => boolean>
        )
      return ret
    }

    return {} as Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
  })

  return { staticFeatures, dynamicFeatures }
}
