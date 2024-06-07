<template>
  <tfoot v-if="tableSlots.foot || showSummary" :class="cls.e('foot')">
    <tr v-if="showSummary">
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
        :key="column.key + column.keySuffix"
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
import type { ColumnNode } from './use-columns'
import { n } from 'cat-kit/fe'
import { UNodeRender } from '../node-render'
import { withUnit } from '@ui/utils'
import type { RenderReturn } from '@ui/types/helper'

defineOptions({
  name: 'TableFoot'
})

const { cls, columnConfig, rows, tableSlots, getCellClass } =
  inject(TableDIKey)!

const { allColumns } = columnConfig

const showSummary = computed(() => {
  return allColumns.value.some(col => !!col.data.summary)
})

function computeSummary(key: string) {
  let sum = 0
  let i = 0
  while (i < rows.value.length) {
    sum = n.plus(sum, rows.value[i]!.data[key])
    if (isNaN(sum)) return sum
    i++
  }

  return sum
}

function getColumnSummaryNode(column: ColumnNode): RenderReturn {
  const { summary } = column.data

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
