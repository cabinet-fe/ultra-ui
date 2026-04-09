<template>
  <u-scroll
    :class="[
      cls.b,
      cls.m(size),
      bem.is('border', border),
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

      <u-table-body ref="tableBody">
        <slot name="body" :columns="leafColumns" :rows="rows" />

        <template #empty v-if="slots.empty">
          <slot name="empty" />
        </template>
      </u-table-body>

      <!-- 占用空间，用来撑开表格高度 -->
      <tbody v-if="virtualEnabled" ref="spaceRef" :style="{ width: '1px' }"></tbody>

      <u-table-foot ref="tableFoot">
        <slot name="foot" :columns="leafColumns" :rows="rows" />
      </u-table-foot>
    </table>

    <slot name="append" />

    <div v-if="showResizeLine" :class="cls.e('resize-line')" ref="resizeLineRef"></div>

    <!-- <u-tip v-if="textEllipsis" ref="tip"> </u-tip> -->
  </u-scroll>
</template>

<script lang="ts" setup>
import type {
  TableProps,
  TableEmits,
  _TableExposed,
  TableColumnSlotsScope,
  ComponentSize,
  ScrollExposed,
  TableRowSlotsScope
} from '../../types'
import { bem, setStyles, withUnit } from '@ultra-ui/utils'
import { computed, nextTick, provide, shallowRef, toRef, useTemplateRef, watch } from 'vue'
import { TableDIKey } from './di'
import { useRows } from './use-rows'
import { useColumns } from './use-columns'
// import { UTip } from '../tip'
import UTableHead from './table-head'
import UTableBody from './table-body.vue'
import UTableFoot from './table-foot.vue'
import { UScroll } from '../scroll'
import { useFallbackProps, useVirtual } from '@ultra-ui/compositions'
import { useCheck } from './use-check'
import { useTable } from './use-table'
import type { TableRowNode } from './node/row'
import { useFixedColumns } from './use-fixed-columns'
import { useColResize } from './use-col-resize'
import type { ColumnNode } from './node/col'

defineOptions({ name: 'Table' })

const props = withDefaults(defineProps<TableProps>(), {
  tree: false,
  stripe: true,
  textOverflow: 'line-break',
  virtualThreshold: 80
})
const emit = defineEmits<TableEmits>()

const slots = defineSlots<{
  [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  [key: `header:${string}`]: (props: { column: ColumnNode }) => any
  'row:expand'?: (props: TableRowSlotsScope) => any
  foot?: (props: { columns: ColumnNode[]; rows: TableRowNode[] }) => any
  body?: (props: { columns: ColumnNode[]; rows: TableRowNode[] }) => any
  empty?: () => any
  append?: () => any
}>()

const cls = bem('table')

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

// 行
const {
  rows,
  toggleTreeRowExpand,
  allExpanded,
  toggleAllTreeRowExpand,
  rowForest,
  handleRowClick,
  handleCellClick,
  getRowByData
} = useRows({ props, emit })

// 选中
const { createCheckColumn, createSelectColumn, clearChecked, clearSelected, checkedRows } =
  useCheck({ size, props, rows, rowForest, emit, cls })

// 列
const columnConfig = useColumns({
  props,
  createCheckColumn,
  createSelectColumn,
  toggleAllTreeRowExpand,
  cls
})

const { leafColumns } = columnConfig

const { handleScroll, leftFixed, rightFixed } = useFixedColumns()

// 在表格中提供的通用方法和属性
const {
  getColumnSlotsNode,
  getExpandRowSlotsNode,
  getHeaderSlotsNode,
  getCellClass,
  getCellCtx,
  getHeaderCellClass
} = useTable({ props, cls, leftFixed, rightFixed })

const scrollRef = shallowRef<ScrollExposed>()

const { showResizeLine, resizeLineRef, colgroupRef } = useColResize({ scrollRef, leafColumns })

const virtualCtx = useVirtual({
  count: computed(() => rows.value.length),
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null),
  estimateSize: () => 52,
  virtualThreshold: toRef(props, 'virtualThreshold')
})

const { virtualList, totalHeight, virtualEnabled } = virtualCtx

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
  (spaceHeight) => {
    nextTick(() => {
      spaceRef.value &&
        setStyles(spaceRef.value, { height: spaceHeight ? `${spaceHeight}px` : undefined })
    })
  },
  { immediate: true }
)

const tableBodyRef = useTemplateRef('tableBody')
watch(
  () => props.data,
  () => {
    tableBodyRef.value?.setBodyTransform(0)
    scrollRef.value?.scrollTo({ y: 0 })
  }
)

// const tipRef = useTemplateRef('tip')

provide(TableDIKey, {
  tableProps: props,
  tableSlots: slots,
  cls,
  rows,
  checkedRows,
  columnConfig,
  handleRowClick,
  handleCellClick,
  getColumnSlotsNode,
  getExpandRowSlotsNode,
  getHeaderSlotsNode,
  getCellClass,
  getCellCtx,
  getHeaderCellClass,
  // tipRef,
  toggleTreeRowExpand,
  ...virtualCtx
})

const tableFootRef = useTemplateRef('tableFoot')

defineExpose<_TableExposed>({
  el: toRef(() => scrollRef.value?.el),
  clearChecked,
  clearSelected,
  getRowByData,
  getSummaryRow: () => tableFootRef.value!.getSummaryRow()
})
</script>
