<template>
  <component :is="tag" :class="cls.b" :style="style" ref="gridRef">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { GridProps, GridEmits } from '@ui/types/components/grid'
import { GridDIKey } from './di'
import { type CSSProperties, computed, shallowRef, provide } from 'vue'
import { useResponsive } from './use-responsive'

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

const style = computed<CSSProperties>(() => {
  const { cols, gap } = props
  const styles: CSSProperties = {}
  if (gap) {
    styles.columnGap = gap + 'px'
  }
  if (!cols) return styles

  switch (typeof cols) {
    case 'number':
      styles.gridTemplateColumns = `repeat(${cols}, 1fr)`
      break
    case 'function':
      styles.gridTemplateColumns = `repeat(${cols(
        currentBreakpoint.value
      )}, 1fr)`
      break
    case 'object':
      const breakpointName = currentBreakpoint.value?.name
      const breakpoint = breakpointName ? cols[breakpointName] : cols.default
      styles.gridTemplateColumns = `repeat(${breakpoint ?? 24}, 1fr)`
  }

  return styles
})

provide(GridDIKey, {
  currentBreakpoint,
  gridItemsProps
})
</script>
