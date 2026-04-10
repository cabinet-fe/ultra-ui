<template>
  <div>
    <u-palette v-model="color" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('#131111')

// setTimeout(() => {
//   color.value = '#C715C799'
// }, 3000)
</script>

<style lang="scss" scoped></style>
