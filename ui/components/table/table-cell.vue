<template>
  <td
    :class="getCellClass(column)"
    :style="{
      left: withUnit(left, 'px'),
      right: withUnit(right, 'px')
    }"
  >
    <slot />
  </td>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import type { ColumnNode } from './use-columns'
import { TableDIKey } from './di'
import { withUnit } from '@ui/utils'

defineOptions({
  name: 'TableCell'
})

const { column } = defineProps<{
  column: ColumnNode
  left?: number
  right?: number
}>()

const { getCellClass } = inject(TableDIKey)!
</script>
