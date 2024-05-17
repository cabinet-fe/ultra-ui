<template>
  <tfoot v-if="tableSlots.foot || showSummary" :class="cls.e('foot')">

    <tr :class="cls.e('row')" v-if="showSummary">
      <td
        v-if="allColumns[0]"
        :class="getCellClass(allColumns[0])"
        :style="{
          right: withUnit(allColumns[0].style.right, 'px'),
          left: withUnit(allColumns[0].style.left, 'px')
        }"
      >
        合计:
      </td>
      <td
        v-for="column of allColumns.slice(1)"
        :class="getCellClass(column)"
        :key="column.key"
        :style="{
          right: withUnit(column.style.right, 'px'),
          left: withUnit(column.style.left, 'px')
        }"
      >
        <u-node-render :content="getColumnSummaryNode(column)" />
      </td>
    </tr>
    <slot />
  </tfoot>
</template>

<script lang="ts" setup>
import { computed, inject, type VNode } from 'vue'
import { TableDIKey } from './di'
import type { ColumnNode } from './use-columns'
import { n } from 'cat-kit/fe'
import { UNodeRender } from '../node-render'
import { withUnit } from '@ui/utils'

defineOptions({
  name: 'TableFoot'
})

const { cls, columnConfig, rows, tableSlots, getCellClass } =
  inject(TableDIKey)!

const { expandColumn, allColumns } = columnConfig

const showSummary = computed(() => {
  return allColumns.value.some(col => !!col.value.summary)
})

function computeSummary(key: string) {
  let sum = 0
  let i = 0
  while (i < rows.value.length) {
    sum = n.plus(sum, rows.value[i]!.value[key])
    if (isNaN(sum)) return sum
    i++
  }

  return sum
}

function getColumnSummaryNode(
  column: ColumnNode
): null | undefined | string | number | VNode | VNode[] {
  const { summary } = column.value

  if (!summary) return null

  let total = computeSummary(column.key)

  if (typeof summary === 'function') {
    return summary({
      total,
      rows: rows.value,
      column
    })
  }
  return total
}
</script>
