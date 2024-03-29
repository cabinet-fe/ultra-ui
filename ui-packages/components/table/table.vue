<template>
  <u-scroll :class="cls.b">
    <table :class="cls.e('wrap')">
      <UTableHead />
      <UTableBody />
    </table>

    <div :class="cls.e('resizer')"></div>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import type {
  TableProps,
  TableEmits,
  TableColumn
} from '@ui/types/components/table'
import { bem } from '@ui/utils'
import { provide, useSlots, type VNode } from 'vue'
import { TableDIKey } from './di'
import { TableRow, useRows } from './use-rows'
import { useColumns } from './use-columns'
import UTableHead from './table-head.vue'
import UTableBody from './table-body.vue'
import { UScroll } from '../scroll'

defineOptions({
  name: 'Table'
})

const props = defineProps<TableProps<DataItem>>()
const emit = defineEmits<TableEmits<DataItem>>()

defineSlots<
  {
    [key: `column:${string}`]: (props: {
      row: TableRow
      column: TableColumn
      val: any
    }) => any
  } & {
    [key: string]: () => any
  }
>()

const cls = bem('table')

const rows = useRows({ props })

const columnConfig = useColumns({ props })

const slots = useSlots()

const getColumnSlotsNode = (key: string, ctx): VNode[] | undefined => {
  return slots[`column:${key}`]?.(ctx) ?? ctx.val
}

provide(TableDIKey, {
  tableProps: props,
  cls,
  rows,
  columnConfig,
  getColumnSlotsNode
})
</script>
