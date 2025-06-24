<template>
  <div>
    <!-- 配置面板 -->
    <u-card class="mb-2">
      <u-card-header> 配置选项 </u-card-header>

      <u-card-content>
        <u-form :model="config" no-tips :cols="7">
          <u-number-input
            field="min"
            :min="0"
            :max="config.data.max"
            label="最小值"
            placeholder="设置最小值"
          />
          <u-number-input
            field="max"
            :min="config.data.min"
            label="最大值"
            placeholder="设置最大值"
          />
          <u-number-input
            field="step"
            label="步长"
            :min="1"
            :max="config.data.max"
            placeholder="设置步长"
          />
          <u-checkbox field="vertical" label="垂直模式" />
          <u-checkbox field="range" label="范围选择" />
          <u-checkbox field="disabled" label="禁用状态" />
          <u-checkbox field="readonly" label="只读模式" />
        </u-form>
      </u-card-content>
    </u-card>

    <!-- 演示区域 -->
    <u-card>
      <u-card-header> 滑块演示 </u-card-header>

      <u-card-content>
        <u-slider
          v-model="sliderValue"
          v-bind="config.data"
          :style="{
            height: config.data.vertical ? '300px' : undefined
          }"
        />

        {{ sliderValue }}
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="tsx" setup>
import { FormModel } from '@ui/components'
import { ref } from 'vue'

const config = new FormModel({
  min: { value: 10 },
  max: { value: 100 },
  step: { value: 10 },
  vertical: { value: false },
  range: { value: false },
  disabled: { value: false },
  readonly: { value: false }
})

const sliderValue = ref(20)
</script>
