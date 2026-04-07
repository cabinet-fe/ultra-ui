<template>
  <td
    :class="getCellClass(column)"
    :style="{
      left: withUnit(left, 'px'),
      right: withUnit(right, 'px')
    }"
    :rowspan="rowspan"
    :colspan="colspan"
    v-if="rowspan !== 0 && colspan !== 0"
    @click="onClick"
  >
    <slot />
  </td>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import type { ColumnNode } from './node/col'
import { TableDIKey } from './di'
import { withUnit } from '@ultra-ui/core'

defineOptions({
  name: 'TableCell'
})

const { column, onClick } = defineProps<{
  column: ColumnNode
  left?: number
  right?: number
  rowspan?: number
  colspan?: number
  onClick?: (e: MouseEvent) => void
}>()

const { getCellClass } = inject(TableDIKey)!
</script>
