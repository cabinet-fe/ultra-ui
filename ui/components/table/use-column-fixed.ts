import { type ShallowRef, ref } from 'vue'
import { debounce } from 'cat-kit/fe'
import type { ScrollPosition } from '@ui/types'

interface UseColumnFixedReturned {
  leftFixed: ShallowRef<boolean>
  rightFixed: ShallowRef<boolean>
  handleScroll: (e: Required<ScrollPosition>) => void
}

export function useColumnFixed(): UseColumnFixedReturned {
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

  return {
    leftFixed,
    rightFixed,
    handleScroll
  }
}
