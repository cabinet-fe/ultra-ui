<template>
  <tbody :class="cls.e('body')">
    <UTableRow v-for="row of rows" :row="row" :key="row.uid" />
  </tbody>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'
import UTableRow from './table-row.vue'

defineOptions({
  name: 'TableBody'
})

const { cls, rows } = inject(TableDIKey)!
</script>