<template>
  <tbody :class="cls.e('body')" ref="bodyRef">
    <template v-for="{ row, index, stripeIndex } of tableRows" :key="row.uid">
      <UExpandTableRow v-if="row.isExpandRow" :row="row" :data-index="index" />
      <UTableRow
        v-else
        :row="row"
        :data-index="index"
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
import { computed, inject, shallowRef, watch } from 'vue'
import { TableDIKey } from './di'
import { UTableRow, UExpandTableRow } from './table-row'
import { UEmpty } from '../empty'
import { bem, setStyles } from '@ui/utils'

defineOptions({
  name: 'TableBody'
})

const { cls, rows, virtualList, columnConfig, tableProps, virtualEnabled } =
  inject(TableDIKey)!
const { leafColumns } = columnConfig

const getStripeCls = computed(() => {
  return tableProps.stripe
    ? (index: number) => bem.is('stripe', index % 2 === 1)
    : () => ''
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

  // 虚拟列表
  return virtualList.value.map(item => {
    return {
      row: rows.value[item.index]!,
      stripeIndex: rows.value[item.index]!.index,
      index: item.index
    }
  })
})

const bodyRef = shallowRef<HTMLElement>()

function setBodyTransform(transformY: number) {
  bodyRef.value &&
    setStyles(bodyRef.value, {
      transform: `translate3d(0, ${transformY}px, 0)`
    })
}

watch(virtualList, list => {
  setBodyTransform(list[0]?.start ?? 0)
})

defineExpose({
  setBodyTransform
})
</script>
