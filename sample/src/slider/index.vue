<template>
  <div>
    <!-- {{ getRandom() }} -->
    基础用法: (min: 20 max: 100)
    <u-slider v-model="sliderValue" :max="100" :min="20"></u-slider>
    <p>值: {{ sliderValue }}</p>

    <u-slider v-model="sliderValue" :max="100" :min="20"></u-slider>

    垂直 (需要传入height)
    <div>
      <u-slider v-model="sliderValue" :max="100" :min="20" vertical></u-slider>
      <p>{{ verticalValue }}</p>
    </div>

    step 步长(x)
    <div>
      <u-slider v-model="stepValue" :step="10" :show-stops="true"></u-slider>
      <p>{{ stepValue }}</p>
    </div>
    <!--
    step 步长(y)
    <div>
      <u-slider
        v-model="stepVerticalValue"
        :vertical="true"
        :height="500"
        :step="10"
        :show-stops="true"
      ></u-slider>
      <p>Parent Value: {{ stepVerticalValue }}</p>
    </div> -->

    <!-- 范围
    <div>
      <u-slider v-model="rangeValue" :range="true"> </u-slider>

      {{ rangeValue }}
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'

const getRandom = () => Math.random()

const sliderValue = ref(50)

const verticalValue = ref(40)

const stepValue = ref(0)

const stepVerticalValue = ref(0)

/** 范围 */
const rangeValue = ref([20, 40])
</script>
<style lang="scss" scoped></style>
