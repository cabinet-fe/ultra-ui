<template>
  <div>
    <u-palette v-model="color" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('#1172C3')

setTimeout(() => {
  color.value = '#C715C721'
}, 3000)
</script>

<style lang="scss" scoped></style>
