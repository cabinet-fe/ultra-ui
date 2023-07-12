<template>
  <div :class="cls.b">
    <UNodeRender :content="renderSlots" />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { GridProps } from './grid.type'
import { useSlots } from 'vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'UGrid'
})

defineProps<GridProps>()

const cls = bem('grid')

const slots = useSlots()
const renderSlots = () => {
  const contents = slots.default?.()
  if (!contents) return null
}
</script>
