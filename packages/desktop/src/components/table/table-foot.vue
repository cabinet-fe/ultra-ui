<template>
  <tfoot v-if="tableSlots.foot || showSummary" :class="cls.e('foot')">
    <tr v-if="showSummary">
      <td
        v-if="leafColumns[0]"
        :class="getCellClass(leafColumns[0])"
        :style="{
          right: withUnit(leafColumns[0].style.right, 'px'),
          left: withUnit(leafColumns[0].style.left, 'px')
        }"
      >
        合计:
      </td>
      <td
        v-for="column of leafColumns.slice(1)"
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
import { computed, inject } from 'vue'
import { TableDIKey } from './di'
import type { ColumnNode } from './node/col'
import { n } from '@cat-kit/core'
import { UNodeRender } from '../node-render'
import { withUnit } from '@ultra-ui/utils'
import type { RenderReturn } from '@ultra-ui/utils/types/helper'

defineOptions({
  name: 'TableFoot'
})

const { cls, columnConfig, rows, checkedRows, tableSlots, getCellClass } =
  inject(TableDIKey)!

const { leafColumns } = columnConfig

const showSummary = computed(() => {
  return leafColumns.value.some(col => !!col.data.summary)
})

function computeSummary(key: string) {
  let sum = 0
  let i = 0

  while (i < rows.value.length) {
    sum = n.plus(sum, rows.value[i]!.data[key] ?? 0)
    if (isNaN(sum)) return sum
    i++
  }

  return sum
}

const summaryRow = computed<Record<string, any>>(() => {
  return leafColumns.value.reduce((acc, column) => {
    if (column.data.summary) {
      acc[column.key] = computeSummary(column.key)
    }
    return acc
  }, {})
})

function getColumnSummaryNode(column: ColumnNode): RenderReturn {
  const { summary } = column.data

  if (!summary) return null

  let total = summaryRow.value[column.key]

  if (typeof summary === 'function') {
    return summary({
      total,
      rows: rows.value,
      checkedRows: checkedRows.value,
      column
    })
  }
  return total
}

defineExpose({
  getSummaryRow(): Record<string, any> {
    return summaryRow.value
  }
})
</script>
