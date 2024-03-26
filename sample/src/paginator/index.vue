<template>
  <u-paginator
    v-model:page-number="pageState.current"
    v-model:page-size="pageState.size"
    :total="120"
    :page-size-options="[10, 20, 50, 200]"
  />
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const pageState = reactive({
  current: 1,
  size: 10
})
</script>
