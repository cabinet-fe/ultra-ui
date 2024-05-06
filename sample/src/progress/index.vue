<template>
  <div class="progressDemo">
    <u-progress :percentage="10"></u-progress>
    <u-progress :percentage="20"></u-progress>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const percentage = ref<number>(10)
</script>

<style lang="scss" scoped>
.progressDemo {
  & > div {
    margin-bottom: 20px;
  }
}
</style>
