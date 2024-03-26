<template>
  <div>
    <u-slider v-model="sliderValue"></u-slider>
    <p>Parent Value: {{ sliderValue }}</p>
  </div>
</template>
<script lang="ts" setup>
import { ref } from '@vue/runtime-core'

const sliderValue = ref(0)
</script>
<style lang="scss" scoped></style>
