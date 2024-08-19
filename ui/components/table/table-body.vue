<template>
  <tbody :class="cls.e('body')" ref="bodyRef">
    <UTableRow
      v-for="item of virtualList"
      :row="rows[item.index]!"
      :key="item.key"
      :data-index="item.index"
    />
    <!-- {{
      console.log(666)
    }} -->

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
import { inject, shallowRef, watch } from 'vue'
import { TableDIKey } from './di'
import UTableRow from './table-row.vue'
import { UEmpty } from '../empty'
import { setStyles } from '@ui/utils'

defineOptions({
  name: 'TableBody'
})

const { cls, rows, virtualList, columnConfig } = inject(TableDIKey)!
const { allColumns } = columnConfig

const bodyRef = shallowRef<HTMLElement>()

watch(virtualList, list => {
  bodyRef.value &&
    setStyles(bodyRef.value, {
      transform: `translate3d(0, ${list[0]?.start ?? 0}px, 0)`
    })
})
</script>
