import { type ShallowRef, watchEffect, type ComputedRef } from 'vue'
import type { VirtualScrollProps } from '@ui/types/components/virtual-scroll'
import { setStyles } from '@ui/utils'

interface Options {
  /** 占位元素高度 */
  spacerRef: ShallowRef<HTMLElement | undefined>
  /** 虚拟列表组件的props */
  props: VirtualScrollProps
  /** 是否虚拟化 */
  virtualization: ComputedRef<boolean>
}

/**
 * 滚动高度
 * @param options 选项
 * @returns
 */
export function useScrollHeight(options: Options) {
  const { spacerRef, props, virtualization } = options

  const updateHeight = (height?: number) => {
    if (!spacerRef.value) return
    setStyles(spacerRef.value, { height: height ? height + 'px' : '' })
  }

  watchEffect(() => {
    const { data, itemSize = 32 } = props
    if (!spacerRef.value || !virtualization.value || !data?.length) return

    updateHeight(data.length * itemSize)
  })
}
