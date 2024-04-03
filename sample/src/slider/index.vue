<template>
  <div>
    <!-- {{ getRandom() }} -->
    基础用法: (min: 20 max: 100)
    <u-slider v-model="sliderValue" :max="100" :min="20"></u-slider>
    <p>值: {{ sliderValue }}</p>

    <u-slider v-model="sliderValue" :max="100" :min="20"></u-slider>

    垂直 (需要传入height)
    <div>
      <u-slider
        v-model="sliderValue"
        :step="10"
        :max="100"
        :min="20"
        vertical
        show-stops
      ></u-slider>
    </div>

    step 步长(x)
    <div>
      <u-slider
        v-model="sliderValue"
        :min="0"
        :max="100"
        :step="10"
        :show-stops="true"
      ></u-slider>
    </div>

    范围
    <div>
      <u-slider v-model="rangeValue" :step="10" show-stops range> </u-slider>

      {{ rangeValue }}
    </div>

    垂直范围
    <div>
      <u-slider v-model="rangeValue" range vertical> </u-slider>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'

const getRandom = () => Math.random()

const sliderValue = ref(50)

const verticalValue = ref(40)

/** 范围 */
const rangeValue = ref([20, 40])

const stepValue = ref(0)

const stepVerticalValue = ref(0)
</script>
<style lang="scss" scoped></style>
