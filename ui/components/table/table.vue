<template>
  <u-scroll :class="[cls.b, cls.m(size)]" @resize="handleTableResize">
    <table
      :class="cls.e('wrap')"
      @mouseenter.capture="eventHandlers.handleMouseEnter"
    >
      <colgroup ref="colgroupRef">
        <col
          v-for="column of columns"
          :style="{
            width: withUnit(column.width, 'px'),
            minWidth: withUnit(column.minWidth, 'px')
          }"
          :class="column.fixed"
        />
      </colgroup>
      <UTableHead />
      <UTableBody />
    </table>

    <div :class="cls.e('resizer')"></div>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import type { TableProps, TableEmits } from '@ui/types/components/table'
import { bem, withUnit } from '@ui/utils'
import { provide, shallowRef, useSlots, type VNode } from 'vue'
import { TableDIKey, type TableColumnSlotsScope } from './di'
import { useRows } from './use-rows'
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
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
    [key: `header:${string}`]: (props: { column: ColumnNode }) => any
  } & {
    [key: string]: () => any
  }
>()

const cls = bem('table')

const rows = useRows({ props })

const columnConfig = useColumns({ props })

const { columns } = columnConfig

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const slots = useSlots()

/** 获取列插槽vnode */
const getColumnSlotsNode = (
  key: string,
  ctx: TableColumnSlotsScope
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

/** 获取单元格类名 */
const getCellClass = (column: ColumnNode): string[] => {
  const classList: string[] = [cls.e('cell'), bem.is(column.align)]
  column.fixed && classList.push(bem.is('fixed-' + column.fixed))
  return classList
}

/** 事件处理 */
const eventHandlers = useEvents({ emit })

const colgroupRef = shallowRef<HTMLElement>()

const handleTableResize = (el: HTMLElement) => {
  const colgroup = colgroupRef.value

  if (!colgroup) return
  const fixedOnLeft = Array.from(
    colgroup.getElementsByClassName('left')
  ) as HTMLElement[]

  const fixedOnRight = Array.from(
    colgroup.getElementsByClassName('right')
  ) as HTMLElement[]

  fixedOnLeft.reduce((acc, col, colIndex) => {
    if (colIndex === 0) {
      columns.value[0]!.style.left = 0
      return acc
    }

    const left = acc + fixedOnLeft[colIndex - 1]!.offsetWidth
    columns.value[colIndex]!.style.left = left
    return left
  }, 0)

  const rightColumns = columns.value.slice(-fixedOnRight.length)

  fixedOnRight.reduceRight((acc, col, colIndex) => {
    if (colIndex === fixedOnRight.length - 1) {
      rightColumns[colIndex]!.style.right = 0

      return acc
    }
    const right = acc + fixedOnRight[colIndex + 1]!.offsetWidth
    rightColumns[colIndex]!.style.right = right

    return right
  }, 0)
}

provide(TableDIKey, {
  tableProps: props,
  cls,
  rows,
  columnConfig,
  eventHandlers,
  getColumnSlotsNode,
  getHeaderSlotsNode,
  getCellClass
})
</script>
