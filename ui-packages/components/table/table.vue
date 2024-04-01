<template>
  <u-scroll :class="[cls.b, cls.m(size)]">
    <table :class="cls.e('wrap')" @mouseenter.capture="eventHandlers.handleMouseEnter">
      <UTableHead />
      <UTableBody />
    </table>

    <div :class="cls.e('resizer')"></div>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import type { TableProps, TableEmits } from '@ui/types/components/table'
import { bem } from '@ui/utils'
import { provide, useSlots, type VNode } from 'vue'
import { TableDIKey } from './di'
import { TableRow, useRows } from './use-rows'
import { ColumnNode, useColumns } from './use-columns'
import UTableHead from './table-head.vue'
import UTableBody from './table-body.vue'
import { UScroll } from '../scroll'
import { useEvents } from './use-events'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Table'
})

const props = defineProps<TableProps<DataItem>>()
const emit = defineEmits<TableEmits<DataItem>>()

defineSlots<
  {
    [key: `column:${string}`]: (props: {
      row: TableRow
      column: ColumnNode
      val: any
    }) => any
    [key: `header:${string}`]: (props: { column: ColumnNode }) => any
  } & {
    [key: string]: () => any
  }
>()

const cls = bem('table')

const rows = useRows({ props })

const columnConfig = useColumns({ props })

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const slots = useSlots()

/** 获取列插槽vnode */
const getColumnSlotsNode = (
  key: string,
  ctx: {
    row: TableRow
    column: ColumnNode
    val: any
  }
): VNode[] | undefined => {
  return slots[`column:${key}`]?.(ctx) ?? ctx.val
}

/** 获取表头插槽vnode */
const getHeaderSlotsNode = (
  key: string,
  ctx: { column: ColumnNode }
): VNode[] | undefined | string => {
  return slots[`header:${key}`]?.(ctx) ?? ctx.column.name
}

/** 事件处理 */
const eventHandlers = useEvents({ emit })

provide(TableDIKey, {
  tableProps: props,
  cls,
  rows,
  columnConfig,
  eventHandlers,

  getColumnSlotsNode,
  getHeaderSlotsNode
})
</script>
