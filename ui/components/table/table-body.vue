<template>
  <tbody :class="cls.e('body')" ref="bodyRef">
    <UTableRow
      v-for="row of virtualRows"
      :row="row"
      :key="row.uid"
      :data-index="row.index"
      :class="[bem.is('current', row.isCurrent && tableProps.highlightCurrent)]"
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
import { computed, inject, shallowRef, watch } from 'vue'
import { TableDIKey } from './di'
import UTableRow from './table-row'
import { UEmpty } from '../empty'
import { bem, setStyles } from '@ui/utils'

defineOptions({
  name: 'TableBody'
})

const { cls, rows, virtualList, columnConfig, tableProps } = inject(TableDIKey)!
const { allColumns } = columnConfig

const virtualRows = computed(() => {
  return virtualList.value.map(item => rows.value[item.index]!)
})

const bodyRef = shallowRef<HTMLElement>()

watch(virtualList, list => {
  bodyRef.value &&
    setStyles(bodyRef.value, {
      transform: `translate3d(0, ${list[0]?.start ?? 0}px, 0)`
    })
})
</script>
