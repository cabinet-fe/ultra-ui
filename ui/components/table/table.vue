<template>
  <u-scroll
    :class="[cls.b, cls.m(size)]"
    ref="scrollRef"
    @resize="handleTableResize"
  >
    <table
      :class="cls.e('wrap')"
      @mouseenter.capture="eventHandlers.handleMouseEnter"
    >
      <colgroup ref="colgroupRef">
        <col
          v-for="column of allColumns"
          :key="column.key"
          :class="column.fixed"
          :style="{
            width: withUnit(column.width, 'px'),
            minWidth: withUnit(column.minWidth, 'px')
          }"
        />
      </colgroup>
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
  _TableExposed,
  TableColumnSlotsScope
} from '@ui/types/components/table'
import { bem, withUnit } from '@ui/utils'
import { computed, provide, shallowRef, useSlots, type VNode } from 'vue'
import { TableDIKey } from './di'
import { TableRow, useRows } from './use-rows'
import { ColumnNode, useColumns } from './use-columns'
import UTableHead from './table-head.vue'
import UTableBody from './table-body.vue'
import { UScroll, type ScrollExposed } from '../scroll'
import { useEvents } from './use-events'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { debounce, getChainValue } from 'cat-kit/fe'
import { useCheck } from './use-check'

defineOptions({
  name: 'Table'
})

const props = withDefaults(defineProps<TableProps<DataItem>>(), {
  tree: false
})
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

const { rows, toggleTreeRowExpand, rowForest } = useRows({ props })

const { createCheckColumn, createSelectColumn } = useCheck({
  props,
  rows,
  rowForest,
  emit
})

const columnConfig = useColumns({
  props,
  createCheckColumn,
  createSelectColumn
})

const { allColumns } = columnConfig

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const slots = useSlots()

/** 获取列插槽vnode */
const getColumnSlotsNode = (
  ctx: TableColumnSlotsScope
): VNode[] | undefined => {
  const { column } = ctx

  const result =
    column.value.render?.(ctx) ??
    (props.slots ?? slots)[`column:${column.key}`]?.(ctx) ??
    ctx.val

  return result
}

/** 获取表头插槽vnode */
const getHeaderSlotsNode = (ctx: {
  column: ColumnNode
}): VNode[] | undefined | string | VNode => {
  const { column } = ctx
  return (
    column.value.nameRender?.(ctx) ??
    (props.slots ?? slots)[`header:${ctx.column.key}`]?.(ctx) ??
    ctx.column.name
  )
}

/** 获取单元格类名 */
const getCellClass = (column: ColumnNode): string => {
  const classList: string[] = [cls.e('cell'), bem.is(column.align)]

  column.fixed && classList.push(bem.is('fixed-' + column.fixed))
  column.isLastFixed && classList.push(bem.is('last-fixed'))
  column.isFirstFixed && classList.push(bem.is('first-fixed'))
  return classList.join(' ')
}

const getCellCtx = (
  row: TableRow,
  column: ColumnNode
): TableColumnSlotsScope => {
  const rowData = row.value
  const val = getChainValue(rowData, column.key)
  return {
    row,
    column,
    rowData,
    val,
    model: {
      modelValue: val,
      'onUpdate:modelValue': (val: any) => {
        rowData[column.key] = val
      }
    }
  }
}

/** 事件处理 */
const eventHandlers = useEvents({ emit })

const colgroupRef = shallowRef<HTMLElement>()

// 在尺寸变更时重新计算固定列的宽度和偏移量
const handleTableResize = debounce(
  () => {
    const colgroup = colgroupRef.value

    if (!colgroup) return

    const fixedOnLeft = Array.from(
      colgroup.getElementsByClassName('left')
    ) as HTMLElement[]

    const fixedOnRight = Array.from(
      colgroup.getElementsByClassName('right')
    ) as HTMLElement[]

    fixedOnLeft.reduce((acc, col, colIndex) => {
      const colNode = allColumns.value[colIndex]!
      colNode.width = col.offsetWidth
      colNode.style.left = acc
      return acc + col.offsetWidth
    }, 0)

    const rightColumns = allColumns.value.slice(-fixedOnRight.length)

    fixedOnRight.reduceRight((acc, col, colIndex) => {
      const colNode = rightColumns[colIndex]!
      colNode.width = col.offsetWidth
      colNode.style.right = acc
      return acc + col.offsetWidth
    }, 0)
  },
  100,
  true
)

provide(TableDIKey, {
  tableProps: props,
  cls,
  rows,
  columnConfig,
  eventHandlers,
  getColumnSlotsNode,
  getHeaderSlotsNode,
  getCellClass,
  getCellCtx,
  toggleTreeRowExpand
})

const scrollRef = shallowRef<ScrollExposed>()

const el = computed(() => {
  return scrollRef.value?.el
})

defineExpose<_TableExposed>({
  el
})
</script>
