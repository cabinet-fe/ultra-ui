<template>
  <tr :class="cls.e('row')" >
    <td v-for="column of fixedOnLeft" :class="cellClass">
      <u-node-render
        :content="
          getColumnSlotsNode(column.key, {
            row,
            column,
            val: row.value[column.key]
          })
        "
      />
    </td>
    <td v-for="column of unfixed" :class="cellClass">
      <u-node-render
        :content="
          getColumnSlotsNode(column.key, {
            row,
            column,
            val: row.value[column.key]
          })
        "
      />
    </td>
    <td v-for="column of fixedOnRight" :class="cellClass">
      <u-node-render
        :content="
          getColumnSlotsNode(column.key, {
            row,
            column,
            val: row.value[column.key]
          })
        "
      />
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'
import type { TableRow } from './use-rows'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'TableRow'
})

defineProps<{
  row: TableRow
}>()

const { cls, columns, getColumnSlotsNode } = inject(TableDIKey)!

const cellClass = cls.e('cell')

const { fixedOnLeft, unfixed, fixedOnRight } = columns
</script>
