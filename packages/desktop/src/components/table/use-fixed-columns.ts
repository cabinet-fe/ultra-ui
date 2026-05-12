import { debounce } from '@cat-kit/core'
import { type ShallowRef, ref } from 'vue'

import type { ScrollPosition } from '../../types'

interface UseColumnFixedReturned {
  leftFixed: ShallowRef<boolean>
  rightFixed: ShallowRef<boolean>
  handleScroll: (e: Required<ScrollPosition>) => void
}

export function useFixedColumns(): UseColumnFixedReturned {
  const leftFixed = ref(false)
  const rightFixed = ref(false)

  const handleScroll = debounce((e: Required<ScrollPosition>) => {
    const nextLeft = e.x > 0
    // 精度修正：浏览器滚动条最后 1px 的误差
    const nextRight = !(e.cw + e.x + 1 >= e.sw)

    if (nextLeft !== leftFixed.value) leftFixed.value = nextLeft
    if (nextRight !== rightFixed.value) rightFixed.value = nextRight
  }, 100)

  return { leftFixed, rightFixed, handleScroll }
}
