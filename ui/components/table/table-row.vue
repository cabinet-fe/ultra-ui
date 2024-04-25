<template>
  <tr :class="cls.e('row')" @click="eventHandlers.handleRowClick(row)">
    <td
      v-for="(column, index) of columns"
      :class="getCellClass(column)"
      :data-col-index="index"
      :style="{
        left: withUnit(column.style.left, 'px'),
        right: withUnit(column.style.right, 'px')
      }"
    >
      <u-node-render
        :content="
          getColumnSlotsNode(column.key, {
            row,
            rowData,
            column,
            val: rowData[column.key],
            model: {
              modelValue: rowData[column.key],
              'onUpdate:modelValue': (val: any) => {
                rowData[column.key] = val
              }
            }
          })
        "
      />
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { TableDIKey } from './di'
import type { TableRow } from './use-rows'
import { UNodeRender } from '../node-render'
import { withUnit } from '@ui/utils'

defineOptions({
  name: 'TableRow'
})

const props = defineProps<{
  row: TableRow
}>()

const { cls, columnConfig, getColumnSlotsNode, eventHandlers, getCellClass } =
  inject(TableDIKey)!

const { columns } = columnConfig

const rowData = computed<Record<string, any>>(() => {
  return props.row.value
})
</script>
