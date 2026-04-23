<template>
  <tbody :class="cls.e('body')">
    <template v-for="{ row, index, stripeIndex } of tableRows" :key="row.uid">
      <UExpandTableRow v-if="row.isExpandRow" :row="row" :index="index" />
      <UTableRow
        v-else
        :row="row"
        :index="index"
        :class="[bem.is('current', row.isCurrent), getStripeCls(stripeIndex)]"
      />
    </template>

    <!-- 空 -->
    <tr v-if="!rows.length" :class="cls.e('row')">
      <td :colspan="leafColumns.length">
        <slot name="empty">
          <UEmpty :class="cls.e('empty')" />
        </slot>
      </td>
    </tr>

    <slot></slot>
  </tbody>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import { UEmpty } from '../empty'
import { TableDIKey } from './di'
import { UTableRow, UExpandTableRow } from './table-row'

defineOptions({
  name: 'TableBody'
})

const { cls, rows, virtualList, columnConfig, tableProps, virtualEnabled } = inject(TableDIKey)!
const { leafColumns } = columnConfig

const getStripeCls = computed(() => {
  return tableProps.stripe ? (index: number) => bem.is('stripe', index % 2 === 1) : () => ''
})

const tableRows = computed(() => {
  if (!virtualEnabled.value) {
    return rows.value.map((row, index) => {
      return {
        row,
        stripeIndex: row.index,
        index
      }
    })
  }

  // 虚拟列表：仅渲染可视窗口内的行，位置由 table.vue 中的 before/after 占位 tbody 撑开
  return virtualList.value.map((item) => {
    return {
      row: rows.value[item.index]!,
      stripeIndex: rows.value[item.index]!.index,
      index: item.index
    }
  })
})
</script>
