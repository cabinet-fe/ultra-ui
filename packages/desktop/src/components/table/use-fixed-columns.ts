import { debounce } from '@cat-kit/core'
import { type ShallowRef, ref } from 'vue'

import type { ScrollPosition } from '../../types'

interface UseColumnFixedReturned {
  leftFixed: ShallowRef<boolean>
  rightFixed: ShallowRef<boolean>
  handleScroll: (e: Required<ScrollPosition>) => void
}

/**
 * 固定列
 * @returns
 */
export function useFixedColumns(): UseColumnFixedReturned {
  const leftFixed = ref(false)
  const rightFixed = ref(false)

  const handleScroll = debounce((e: Required<ScrollPosition>) => {
    if (e.x > 0) {
      leftFixed.value = true
    } else {
      leftFixed.value = false
    }

    // 精度修正
    if (e.cw + e.x + 1 >= e.sw) {
      rightFixed.value = false
    } else {
      rightFixed.value = true
    }
  }, 50)

  return { leftFixed, rightFixed, handleScroll }
}
