<template>
  <u-steps v-model:active="active" :items="items"></u-steps>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const active = ref<string>('2')

let items = ref([
  { label: '开始', key: '1' },
  { label: '过程x', key: '2' },
  { label: '过程y', key: '3' },
  { label: '结束', key: '4' }
])
</script>