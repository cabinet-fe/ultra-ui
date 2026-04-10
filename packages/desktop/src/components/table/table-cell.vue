<template>
  <td
    :class="getCellClass(column)"
    :style="{ left: withUnit(left, 'px'), right: withUnit(right, 'px') }"
    :rowspan="rowspan"
    :colspan="colspan"
    v-if="rowspan !== 0 && colspan !== 0"
  >
    <slot />
  </td>
</template>

<script lang="ts" setup>
import { withUnit } from '@ultra-ui/utils'
import { inject } from 'vue'

import { TableDIKey } from './di'
import type { ColumnNode } from './node/col'

defineOptions({
  name: 'TableCell'
})

const { column } = defineProps<{
  column: ColumnNode
  left?: number
  right?: number
  rowspan?: number
  colspan?: number
}>()

const { getCellClass } = inject(TableDIKey)!
</script>
