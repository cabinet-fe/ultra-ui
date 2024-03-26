<template>
  <div>
    <div class="wrap1">
      <u-steps v-model:active="active" :items="items"></u-steps>
    </div>
    <div class="wrap2">
      <u-steps v-model:active="active" :items="items" mode="vertical"></u-steps>
    </div>
  </div>
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

<style lang="scss" scoped>
.wrap1 {
  width: 800px;
  height: 200px;
  border: 1px solid gold;
}
.wrap2 {
  border: 1px solid gold;
  width: 200px;
  height: 600px;
}
</style>