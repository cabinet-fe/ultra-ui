<template>
  <component :is="tag" :class="cls.b" ref="gridRef">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { bem, setStyles, withUnit } from '@ui/utils'
import type {
  GridProps,
  GridEmits,
  _GridExposed
} from '@ui/types/components/grid'
import { GridDIKey } from './di'
import { type CSSProperties, shallowRef, provide, watchEffect } from 'vue'
import { useResponsive } from './use-responsive'
import { getBreakpointCols } from './breakpoint'

defineOptions({
  name: 'Grid'
})

const props = withDefaults(defineProps<GridProps>(), {
  tag: 'div'
})

const emit = defineEmits<GridEmits>()

const cls = bem('grid')

const gridRef = shallowRef<HTMLElement>()

const { currentBreakpoint, gridItemsProps } = useResponsive({
  props,
  emit,
  gridRef
})

// 不使用computed以减少重复渲染
watchEffect(() => {
  const { gap, cols } = props
  const breakpoint = currentBreakpoint.value

  const style: CSSProperties = {}

  if (typeof gap === 'number') {
    if (gap > 0) {
      style.columnGap = gap + 'px'
    }
  } else if (typeof gap === 'string') {
    const [rowGap, columnGap] = gap.split(' ')
    style.columnGap = withUnit(columnGap, 'px')
    style.rowGap = rowGap
  }

  if (!cols) {
    delete style.gridTemplateColumns
  } else {
    switch (typeof cols) {
      case 'number':
        style.gridTemplateColumns = `repeat(${cols}, minmax(0px, 1fr))`
        break
      case 'function':
        style.gridTemplateColumns = `repeat(${cols(breakpoint)}, minmax(0px, 1fr))`
        break
      case 'object':
        const amount = getBreakpointCols(cols, breakpoint)
        style.gridTemplateColumns = `repeat(${amount}, minmax(0px, 1fr))`
    }
  }

  gridRef.value && setStyles(gridRef.value, style)
})

provide(GridDIKey, {
  currentBreakpoint,
  gridItemsProps
})

defineExpose<_GridExposed>({
  el: gridRef
})
</script>
