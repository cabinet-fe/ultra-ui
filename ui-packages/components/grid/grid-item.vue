<template>
  <component :is="tag" :style="style" :class="cls.b" v-if="span !== 0">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import type { GridItemProps } from '@ui/types/components/grid'
import { computed, inject, type CSSProperties, watch } from 'vue'
import { GridDIKey } from './di'
import { bem } from '@ui/utils'

defineOptions({
  name: 'GridItem'
})

const props = withDefaults(defineProps<GridItemProps>(), {
  tag: 'div'
})

const cls = bem('grid-item')

const { currentBreakpoint, gridItemsProps } = inject(GridDIKey) ?? {}

if (!currentBreakpoint) {
  console.error('GridItem组件仅能在Grid组件中使用')
}

const span = computed<number | 'full'>(() => {
  let { span } = props
  if (span === undefined) return 1
  if (span === 'full') return 'full'

  if (typeof span === 'number') return span

  const breakpoint = currentBreakpoint?.value

  if (!breakpoint) return span.default
  return span[breakpoint.name] ?? span.default
})

const style = computed<CSSProperties>(() => {
  return {
    gridColumn: span.value === 'full' ? '1 / -1' : `span ${span.value}`
  }
})

watch(
  () => props.span,
  span => {
    if (typeof span === 'object') {
      gridItemsProps?.add(props)
    } else {
      gridItemsProps?.delete(props)
    }
  },
  { immediate: true }
)
</script>
