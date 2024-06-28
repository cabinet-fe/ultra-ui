<template>
  <tbody :class="cls.e('body')">
    <UTableRow
      v-for="row of rows"
      :row="row"
      :key="row.uid"
      :data-key="row.uid"
    />

    <tr v-if="!rows.length" :class="cls.e('row')">
      <td :colspan="allColumns.length">
        <UEmpty :class="cls.e('empty')" />
      </td>
    </tr>
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

const { cls, rows, columnConfig } = inject(TableDIKey)!
const { allColumns } = columnConfig
</script>
