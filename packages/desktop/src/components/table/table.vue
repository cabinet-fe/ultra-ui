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

      <!-- 虚拟滚动上占位：替代 tbody transform，避免 table-layout: fixed 下列宽抖动 -->
      <tbody v-if="virtualEnabled && beforeSize > 0" aria-hidden="true">
        <tr :style="{ height: `${beforeSize}px` }">
          <td :colspan="leafColumns.length" style="padding: 0; border: none"></td>
        </tr>
      </tbody>

      <u-table-body>
        <slot name="body" :columns="leafColumns" :rows="rows" />

        <template #empty v-if="slots.empty">
          <slot name="empty" />
        </template>
      </u-table-body>

      <!-- 虚拟滚动下占位 -->
      <tbody v-if="virtualEnabled && afterSize > 0" aria-hidden="true">
        <tr :style="{ height: `${afterSize}px` }">
          <td :colspan="leafColumns.length" style="padding: 0; border: none"></td>
        </tr>
      </tbody>

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
import { useFallbackProps, useVirtual } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
import { computed, provide, shallowRef, toRef, useTemplateRef, watch } from 'vue'

import type {
  TableProps,
  TableEmits,
  _TableExposed,
  TableColumnSlotsScope,
  ComponentSize,
  ScrollExposed,
  TableRowSlotsScope
} from '../../types'
import { UScroll } from '../scroll'
import { TableDIKey } from './di'
import type { ColumnNode } from './node/col'
import type { TableRowNode } from './node/row'
import UTableBody from './table-body.vue'
import UTableFoot from './table-foot.vue'
// import { UTip } from '../tip'
import UTableHead from './table-head'
import { useCheck } from './use-check'
import { useColResize } from './use-col-resize'
import { useColumns } from './use-columns'
import { useFixedColumns } from './use-fixed-columns'
import { useRows } from './use-rows'
import { useTable } from './use-table'

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
  // 默认行高度约 41px（默认尺寸下 padding + 边框 + 一行文字）；
  // 首个真实渲染行落定后 `useVirtual` 会按实测值自动校准，估值偏差 1~2px 亦不引起抖动。
  estimateSize: () => 41,
  virtualThreshold: toRef(props, 'virtualThreshold')
})

const { virtualEnabled, beforeSize, afterSize } = virtualCtx

watch(
  () => props.data,
  () => {
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
