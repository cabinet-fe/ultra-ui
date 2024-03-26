<template>
  <div>
    <span>size: large</span>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
      :total="120"
      :page-size-options="[10, 20, 50, 200]"
      size="large"
    />
    <hr />
    <span>size: small</span>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
      :total="120"
      :page-size-options="[10, 20, 50, 200]"
      size="small"
    />
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const pageState = reactive({
  current: 1,
  size: 10
})
</script>
