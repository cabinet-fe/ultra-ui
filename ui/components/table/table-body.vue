<template>
  <tbody :class="cls.e('body')">
    <UTableRow
      v-for="item of virtualList"
      :row="rows[item.index]!"
      :key="item.key"
      :data-index="item.index"
      :measure-element="measureElement"
    />

    <!-- 空 -->
    <tr v-if="!rows.length" :class="cls.e('row')">
      <td :colspan="allColumns.length">
        <slot name="empty"><UEmpty :class="cls.e('empty')" /></slot>
      </td>
    </tr>

    <slot></slot>
  </tbody>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'
import UTableRow from './table-row.vue'
import { UEmpty } from '../empty'

defineOptions({
  name: 'TableBody'
})

const { cls, rows, virtualList, measureElement, columnConfig } =
  inject(TableDIKey)!
const { allColumns } = columnConfig
</script>
