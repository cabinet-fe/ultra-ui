<template>
  <div>
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
      <u-slider v-model="rangeValue" :step="10" show-stops range> </u-slider>
      {{ rangeValue }}
    </div>

    垂直范围
    <div>
      <u-slider v-model="rangeValue" range vertical> </u-slider>
      <u-slider v-model="rangeValue" range vertical> </u-slider>
    </div>

    表单
    {{ model }}
    <u-form :model="model">
      <u-input field="name" label="姓名" tips="四个字以内" />
      <u-slider field="number" label="滑块"></u-slider>
    </u-form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'
import { FormModel } from 'ultra-ui'

// const getRandom = () => Math.random()

const model = new FormModel({
  name: {},
  number: { required: true }
})

const sliderValue = ref()

/** 范围 */
const rangeValue = ref()
</script>
<style lang="scss" scoped></style>
