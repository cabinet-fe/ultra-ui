<template>
  <div class="progressDemo">
    <u-progress
      :percentage="item.percentage"
      :color="item.type"
      v-for="(item, index) in list"
      :key="index"
    ></u-progress>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const list = ref([
  { percentage: 10, type: 'primary' },
  { percentage: 20, type: 'info' },
  { percentage: 40, type: 'success' },
  { percentage: 60, type: 'warning' },
  { percentage: 80, type: 'danger' }
])
</script>

<style lang="scss" scoped>
.progressDemo {
  & > div {
    margin-bottom: 20px;
  }
}
</style>
