<template>
  <tbody :class="bodyCls">
    <template v-for="{ row, index, stripeIndex } of tableRows" :key="row.uid">
      <UExpandTableRow v-if="row.isExpandRow" :row="row" :index="index" />
      <UTableRow v-else :row="row" :index="index" :class="getStripeCls(stripeIndex)" />
    </template>

    <!-- 空 -->
    <tr v-if="!rows.length" :class="emptyRowCls">
      <td :colspan="leafColumns.length">
        <slot name="empty">
          <UEmpty :class="emptyCls" />
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

defineOptions({ name: 'TableBody' })

const { cls, rows, virtualList, columnConfig, tableProps, virtualEnabled } = inject(TableDIKey)!
const { leafColumns } = columnConfig

// A1 的同族优化：把 body / empty / empty-row 等静态 class 一次性取出，
// 避免每次 render 触发 `cls.e` 的字符串拼接。
const bodyCls = cls.e('body')
const emptyRowCls = cls.e('row')
const emptyCls = cls.e('empty')

/**
 * C1：stripe class 查找表。
 *
 * `bem.is('stripe', true) === 'is-stripe'`，`bem.is('stripe', false) === ''`。
 * 两种输出是全局常量，无需每次调用 `bem.is`；按奇偶直接查表即可。
 * 非 stripe 模式下两个位置均返回空串。
 */
const STRIPE_CLS_ON: readonly [string, string] = [bem.is('stripe', false), bem.is('stripe', true)]
const STRIPE_CLS_OFF: readonly [string, string] = ['', '']

const stripeTable = computed<readonly [string, string]>(() =>
  tableProps.stripe ? STRIPE_CLS_ON : STRIPE_CLS_OFF
)
const getStripeCls = (index: number): string => stripeTable.value[index & 1]!

const tableRows = computed(() => {
  if (!virtualEnabled.value) {
    return rows.value.map((row, index) => {
      return { row, stripeIndex: row.index, index }
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
