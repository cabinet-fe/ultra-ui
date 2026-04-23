import { debounce } from '@cat-kit/core'
import { type ShallowRef, type Ref, ref, watch } from 'vue'

import type { ScrollPosition } from '../../types'

interface UseColumnFixedReturned {
  leftFixed: ShallowRef<boolean>
  rightFixed: ShallowRef<boolean>
  handleScroll: (e: Required<ScrollPosition>) => void
}

interface Options {
  /**
   * D1：滚动中 (`true`) 暂缓 `leftFixed` / `rightFixed` 的切换，滚动结束后
   * 一次性补算。
   *
   * 背景：固定列的阴影是通过在 cell 上切换 `is-last-fixed` / `is-first-fixed`
   * 等 class 实现的，这些 class 会穿透到 `useTable.getCellClass` 的缓存键，
   * 任何一次切换都会让全表的单元格类名失效重算。滚动本身并不需要实时更新阴影，
   * 因此把切换推迟到 `isScrolling` 归零时做一次即可。
   *
   * 未传入时退化到旧行为（实时切换）。
   */
  isScrolling?: Ref<boolean>
}

/**
 * 固定列
 * @returns
 */
export function useFixedColumns(options: Options = {}): UseColumnFixedReturned {
  const { isScrolling } = options

  const leftFixed = ref(false)
  const rightFixed = ref(false)

  let pendingLeft: boolean | null = null
  let pendingRight: boolean | null = null

  const applyImmediate = (nextLeft: boolean, nextRight: boolean): void => {
    if (nextLeft !== leftFixed.value) leftFixed.value = nextLeft
    if (nextRight !== rightFixed.value) rightFixed.value = nextRight
    pendingLeft = null
    pendingRight = null
  }

  const handleScroll = debounce((e: Required<ScrollPosition>) => {
    const nextLeft = e.x > 0
    // 精度修正：浏览器滚动条最后 1px 的误差
    const nextRight = !(e.cw + e.x + 1 >= e.sw)

    if (isScrolling?.value) {
      pendingLeft = nextLeft
      pendingRight = nextRight
      return
    }

    applyImmediate(nextLeft, nextRight)
  }, 50)

  if (isScrolling) {
    watch(isScrolling, (v) => {
      if (v) return
      if (pendingLeft === null && pendingRight === null) return
      applyImmediate(pendingLeft ?? leftFixed.value, pendingRight ?? rightFixed.value)
    })
  }

  return { leftFixed, rightFixed, handleScroll }
}
