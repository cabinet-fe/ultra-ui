<template>
  <tr :class="cls.e('row')" @click="eventHandlers.handleRowClick(row)">
    <td
      v-for="(column, index) of columns"
      :class="[cls.e('cell'), cls.em('cell', column.align)]"
      :data-col-index="index"
    >
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

const { cls, columnConfig, getColumnSlotsNode, eventHandlers } =
  inject(TableDIKey)!

const { columns } = columnConfig
</script>
