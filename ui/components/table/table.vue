<template>
  <u-scroll
    :class="[
      cls.b,
      cls.m(size),
      bem.is('all-expanded', allExpanded),
      bem.is('text-ellipsis', textEllipsis)
    ]"
    ref="scrollRef"
    :content-class="cls.e('content')"
    @scroll="handleScroll"
  >
    <table :class="cls.e('wrap')">
      <colgroup ref="colgroupRef">
        <col
          v-for="column of leafColumns"
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
        <slot name="body" :columns="leafColumns" :rows="rows" />

        <template #empty v-if="slots.empty">
          <slot name="empty" />
        </template>
      </UTableBody>

      <!-- 占用空间，用来撑开表格高度 -->
      <tbody
        ref="spaceRef"
        :style="{
          width: '1px'
        }"
      ></tbody>

      <UTableFoot>
        <slot name="foot" :columns="leafColumns" :rows="rows" />
      </UTableFoot>
    </table>

    <slot name="append" />

    <div
      v-if="showResizeLine"
      :class="cls.e('resize-line')"
      ref="resizeLineRef"
    ></div>

    <u-tip v-if="textEllipsis" ref="tipRef"> </u-tip>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import type {
  TableProps,
  TableEmits,
  _TableExposed,
  TableColumnSlotsScope
} from '@ui/types/components/table'
import { bem, setStyles, withUnit } from '@ui/utils'
import { computed, provide, shallowRef, toRef, watch } from 'vue'
import { TableDIKey } from './di'
import { useRows } from './use-rows'
import { useColumns } from './use-columns'
import { UTip } from '../tip'
import UTableHead from './table-head'
import UTableBody from './table-body.vue'
import UTableFoot from './table-foot.vue'
import { UScroll } from '../scroll'
import { useFallbackProps, useVirtual } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { useCheck } from './use-check'
import { useTable } from './use-table'
import type { TableRowNode } from './node/row'
import { useColumnFixed } from './use-column-fixed'
import { useColResize } from './use-col-resize'
import type { ScrollExposed } from '@ui/types'
import type { ColumnNode } from './node/col'

defineOptions({
  name: 'Table'
})

const props = withDefaults(defineProps<TableProps<DataItem>>(), {
  tree: false,
  textOverflow: 'line-break'
})
const emit = defineEmits<TableEmits>()

const slots = defineSlots<{
  [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  [key: `header:${string}`]: (props: { column: ColumnNode }) => any
  foot?: (props: { columns: ColumnNode[]; rows: TableRowNode[] }) => any
  body?: (props: { columns: ColumnNode[]; rows: TableRowNode[] }) => any
  empty?: () => any
  append?: () => any
}>()

const cls = bem('table')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

// 行
const {
  rows,
  toggleTreeRowExpand,
  allExpanded,
  toggleAllTreeRowExpand,
  rowForest,
  handleRowClick,
  getRowByData
} = useRows({
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
  toggleAllTreeRowExpand,
  cls
})

const { leafColumns } = columnConfig

const { handleScroll, leftFixed, rightFixed } = useColumnFixed()

// 在表格中提供的通用方法和属性
const {
  getColumnSlotsNode,
  getHeaderSlotsNode,
  getCellClass,
  getCellCtx,
  getHeaderCellClass
} = useTable({
  props,
  cls,
  leftFixed,
  rightFixed
})

const scrollRef = shallowRef<ScrollExposed>()

const { showResizeLine, resizeLineRef, colgroupRef } = useColResize({
  scrollRef,
  leafColumns
})

const virtualCtx = useVirtual({
  count: computed(() => rows.value.length),
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null),
  estimateSize: () => 52
})

const { virtualList, totalHeight } = virtualCtx

const spaceHeight = computed(() => {
  if (virtualList.value.length) {
    return (
      totalHeight.value -
      virtualList.value[virtualList.value.length - 1]!.end +
      virtualList.value[0]!.start
    )
  }
  return totalHeight.value
})

const spaceRef = shallowRef<HTMLElement>()

watch(
  spaceHeight,
  spaceHeight => {
    spaceRef.value &&
      setStyles(spaceRef.value, {
        height: `${spaceHeight}px`
      })
  },
  { immediate: true }
)

const tipRef = shallowRef()

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
  getHeaderCellClass,
  // tipRef,
  toggleTreeRowExpand,
  ...virtualCtx
})

defineExpose<_TableExposed>({
  el: toRef(() => scrollRef.value?.el),
  clearChecked,
  clearSelected,
  getRowByData
})
</script>
