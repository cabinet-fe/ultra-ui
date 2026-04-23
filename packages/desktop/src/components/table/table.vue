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
    {{ console.log(1) }}
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

      <!--
        虚拟滚动上占位：替代 tbody transform，避免 table-layout: fixed 下列宽抖动。
        高度由 useVirtualizer 命令式写入 `style.height`，不经过模板响应式绑定，
        因此滚动窗口变化不会引起表格模板重渲染。
      -->
      <tbody v-if="virtualEnabled" aria-hidden="true">
        <tr ref="beforeSpacerRef">
          <td :colspan="leafColumns.length" style="padding: 0; border: none"></td>
        </tr>
      </tbody>

      <u-table-body>
        <slot name="body" :columns="leafColumns" :rows="rows" />

        <template #empty v-if="slots.empty">
          <slot name="empty" />
        </template>
      </u-table-body>

      <!-- 虚拟滚动下占位（高度由 useVirtualizer 命令式写入） -->
      <tbody v-if="virtualEnabled" aria-hidden="true">
        <tr ref="afterSpacerRef">
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
import { useFallbackProps, useVirtualizer } from '@veltra/compositions'
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

const scrollRef = shallowRef<ScrollExposed>()

// 占位 tr 的 DOM 句柄；交给 useVirtualizer 直接命令式写 style.height。
const beforeSpacerRef = useTemplateRef<HTMLElement>('beforeSpacerRef')
const afterSpacerRef = useTemplateRef<HTMLElement>('afterSpacerRef')

// 行（useRows / useFixedColumns 需要 isScrolling，而虚拟化 hook 又依赖 rows.length；
// 先用中继占位，下方 isScrolling 到位后 watch 回灌）。
const isScrollingRelay = shallowRef(false)

const {
  rows,
  toggleTreeRowExpand,
  allExpanded,
  toggleAllTreeRowExpand,
  rowForest,
  handleRowClick,
  handleCellClick,
  getRowByData
} = useRows({ props, emit, isScrolling: isScrollingRelay })

const { createCheckColumn, createSelectColumn, clearChecked, clearSelected, checkedRows } =
  useCheck({ size, props, rows, rowForest, emit, cls })

const columnConfig = useColumns({
  props,
  createCheckColumn,
  createSelectColumn,
  toggleAllTreeRowExpand,
  cls
})

const { leafColumns } = columnConfig

const { handleScroll, leftFixed, rightFixed } = useFixedColumns({
  isScrolling: isScrollingRelay
})

const {
  getColumnSlotsNode,
  getExpandRowSlotsNode,
  getHeaderSlotsNode,
  getCellClass,
  getCellCtx,
  getHeaderCellClass
} = useTable({ props, cls, leftFixed, rightFixed })

const { showResizeLine, resizeLineRef, colgroupRef } = useColResize({ scrollRef, leafColumns })

const { virtualizer, items, isScrolling } = useVirtualizer({
  count: computed(() => rows.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  beforeEl: beforeSpacerRef,
  afterEl: afterSpacerRef,
  estimateSize: () => 41,
  // 注意：getItemKey 在构造期一次性写入底层 Virtualizer；闭包每次读的是当前 rows.value，
  // rows 引用整体替换后 key 仍有效（无需再 setOptions）。
  getItemKey: (i) => rows.value[i]?.uid ?? i
})

const virtualEnabled = computed(() => {
  const t = props.virtualThreshold
  return t ? rows.value.length > t : true
})

// 把虚拟化 isScrolling 回灌到中继，供 useRows / useFixedColumns 读取。
watch(isScrolling, (v) => {
  isScrollingRelay.value = v
})

/**
 * E1：数据替换时的条件置顶。
 *
 * 旧实现无差别地 `scrollTo({ y: 0 })`，在「行内增删 / 排序 / 单行更新」等
 * 场景会把用户当前阅读位置跳走；仅在「翻页 / 显著数据集替换」时才需要复位。
 *
 * 判定阈值：|Δlen| / max(newLen, oldLen) ≥ 0.5，即行数变化量超过更大侧的一半时视为显著变化。
 * 选择 0.5 是因为典型的分页/搜索场景会带来 50% 以上的行数差（通常完全替换数据集），
 * 而行内追加 / 删除个位数通常只带来 <5% 的变化；两者区分度足够宽。
 */
const LENGTH_DELTA_RATIO_TO_RESET_SCROLL = 0.5

watch(
  () => props.data,
  (next, prev) => {
    const nextLen = next?.length ?? 0
    const prevLen = prev?.length ?? 0
    const denom = Math.max(nextLen, prevLen, 1)
    const ratio = Math.abs(nextLen - prevLen) / denom
    if (ratio >= LENGTH_DELTA_RATIO_TO_RESET_SCROLL) {
      scrollRef.value?.scrollTo({ y: 0 })
    }
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
  virtualList: items,
  virtualEnabled,
  measureElement: (index, el) => virtualizer.measureElement(index, el)
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
