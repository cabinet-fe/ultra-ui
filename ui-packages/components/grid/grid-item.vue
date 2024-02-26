<template>
  <UNodeRender :content="getNode()" />
</template>

<script lang="ts" setup>
import type { GridItemProps } from '@ui/types/components/grid'
import type { UNodeRender } from '../node-render'
import { inject, useSlots, watchEffect } from 'vue'
import { GridDIKey } from './di'

defineOptions({
  name: 'GridItem'
})

const props = defineProps<GridItemProps>()

const injected = inject(GridDIKey)

if (!injected) {
  console.warn('GridItem组件仅能在Grid组件中使用')
}

const slots = useSlots()
const getNode = () => {
  const nodes = slots.default?.()
  if (!nodes) return null

  if (nodes.length === 1) {
    return nodes[0]
  }
}

watchEffect(() => {
  const { xs, sm, md, lg, xl } = props
  if (xs ?? sm ?? md ?? lg ?? xl) {
    injected?.setResponsive(true)
  } else {
    injected?.setResponsive(false)
  }
})
</script>
