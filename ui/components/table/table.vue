<template>
  <u-scroll
    :class="[cls.b, cls.m(size)]"
    ref="scrollRef"
    @resize="updateStylesOfColumns"
  >
    <table :class="cls.e('wrap')">
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
      <UTableBody>
        <slot name="body" :columns="allColumns" :rows="rows" />

        <template #empty v-if="slots.empty">
          <slot name="empty" />
        </template>
      </UTableBody>
      <UTableFoot>
        <slot name="foot" :columns="allColumns" :rows="rows" />
      </UTableFoot>
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
import { computed, provide, shallowRef } from 'vue'
import { TableDIKey } from './di'
import { TableRow, useRows } from './use-rows'
import { ColumnNode, useColumns } from './use-columns'
import UTableHead from './table-head.vue'
import UTableBody from './table-body.vue'
import UTableFoot from './table-foot.vue'
import { UScroll, type ScrollExposed } from '../scroll'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { useCheck } from './use-check'
import { useTable } from './use-table'

defineOptions({
  name: 'Table'
})

const props = withDefaults(defineProps<TableProps<DataItem>>(), {
  tree: false
})
const emit = defineEmits<TableEmits>()

const slots = defineSlots<{
  [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  [key: `header:${string}`]: (props: { column: ColumnNode }) => any
  foot?: (props: { columns: ColumnNode[]; rows: TableRow[] }) => any
  body?: (props: { columns: ColumnNode[]; rows: TableRow[] }) => any
  empty?: () => any
}>()

const cls = bem('table')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const colgroupRef = shallowRef<HTMLElement>()

// 行
const { rows, toggleTreeRowExpand, rowForest, handleRowClick, getRowByData } =
  useRows({
    props,
    emit
  })

// 选中
const { createCheckColumn, createSelectColumn, clearChecked, clearSelected } =
  useCheck({
    size,
    props,
    rows,
    rowForest,
    emit,
    cls
  })

// 列
const columnConfig = useColumns({
  props,
  createCheckColumn,
  createSelectColumn,
  colgroupRef
})

const { allColumns, updateStylesOfColumns } = columnConfig

// 在表格中提供的通用方法和属性
const { getColumnSlotsNode, getHeaderSlotsNode, getCellClass, getCellCtx } =
  useTable({
    props,
    cls
  })

provide(TableDIKey, {
  tableProps: props,
  tableSlots: slots,
  cls,
  rows,
  columnConfig,
  handleRowClick,
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
  el,
  clearChecked,
  clearSelected,
  getRowByData
})
</script>
