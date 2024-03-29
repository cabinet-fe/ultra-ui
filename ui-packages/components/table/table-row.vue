<template>
  <tr :class="cls.e('row')">
    <td :class="cellClass" v-for="column of columns">
      <u-node-render
        :content="
          getColumnSlotsNode(column.colKey, {
            row,
            column,
            val: row.value[column.colKey]
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

const { cls, columnConfig, getColumnSlotsNode } = inject(TableDIKey)!

const cellClass = cls.e('cell')

const { columns } = columnConfig
</script>
