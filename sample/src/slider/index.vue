<template>
  <div>
    基础用法:
    <u-slider v-model="sliderValue"></u-slider>
    <p>Parent Value: {{ sliderValue }}</p>

    垂直 (需要传入height)
    <div>
      <u-slider
        v-model="verticalValue"
        :vertical="true"
        :height="500"
      ></u-slider>
      <p>Parent Value: {{ verticalValue }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'

const sliderValue = ref(40)

const verticalValue = ref(40)
</script>
<style lang="scss" scoped></style>
