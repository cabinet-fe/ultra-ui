<template>
  <div>
    基础用法:
    <u-slider v-model="sliderValue"></u-slider>
    <p>Parent Value: {{ sliderValue }}</p>

    垂直 (需要传入height)
    <div>
      <u-slider v-model="verticalValue" :vertical="true"></u-slider>
      <p>Parent Value: {{ verticalValue }}</p>
    </div>

    step 步长(x)
    <div>
      <u-slider v-model="stepValue" :step="10" :show-stops="true"></u-slider>
      <p>Parent Value: {{ stepValue }}</p>
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
  </div>

  范围
  <div>
    <u-slider v-model="rangeValue" :range="true"> </u-slider>

    {{ rangeValue }}
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'

const sliderValue = ref(40)

const verticalValue = ref(40)

const stepValue = ref(0)

const stepVerticalValue = ref(0)

/** 范围 */
const rangeValue = ref([20,40])
</script>
<style lang="scss" scoped></style>
