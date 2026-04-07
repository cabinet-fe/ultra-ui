<template>
  <div>鼠标浮动在图标上</div>
  <u-steps :items :current="current">
    <template #tip="{ item }">
      {{ item.tip }}
    </template>
  </u-steps>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const current = ref(2)
const items = Array.from({ length: 5 }, (_, index) => ({
  label: `步骤${index + 1}`,
  tip: `步骤${index + 1}的提示`
}))
</script>
