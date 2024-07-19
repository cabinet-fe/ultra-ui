<template>
  <div :class="className">
    <!-- 条形进度条 -->
    <div :class="cls.e('bar-wrap')" v-if="!circle">
      <div :class="cls.e('bar')" :style="{ width: percentage + '%' }">
        <slot v-bind="{ percentage, type }">{{ percentage }}%</slot>
      </div>
    </div>

    <!-- 环形进度条 -->
    <div
      v-else
      :class="cls.e('circle')"
      :style="{ height: withUnit(size, 'px'), width: withUnit(size, 'px') }"
    >
      <svg viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          :r="r"
          fill="none"
          stroke="#f5f8fa"
          stroke-width="8"
        />
        <circle
          :class="cls.e('circle-ring')"
          cx="50"
          cy="50"
          :r="r"
          fill="none"
          :stroke="stroke"
          stroke-width="8"
          :stroke-dasharray="dashArray"
          :stroke-dashoffset="offset"
          :stroke-linecap="percentage === 0 ? undefined : 'round'"
        />
      </svg>

      <div :class="cls.e('circle-content')">
        <slot v-bind="{ percentage, type }"> {{ percentage }}% </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProgressProps } from '@ui/types/components/progress'
import { bem, withUnit } from '@ui/utils'
import { computed } from 'vue'
import { n } from 'cat-kit/fe'
import type { ColorType } from '@ui/types'

defineOptions({
  name: 'Progress'
})

const props = withDefaults(defineProps<ProgressProps>(), {
  type: 'primary',
  circle: false
})

defineSlots<{
  default: (props: {
    /** 进度百分比 */
    percentage: number
    /** 样式类型 */
    type: ColorType
  }) => any
}>()

const cls = bem('progress')

const percentage = computed(() => {
  return n(props.percentage ?? 0).range(0, 100)
})

const type = computed<ColorType>(() => {
  const { type } = props
  return typeof type === 'function' ? type(percentage.value) : type
})

const className = computed(() => {
  return [cls.b, bem.is('circle', props.circle), cls.m(type.value)]
})

/** 描边 */
const stroke = computed(() => {
  return `var(--color-${type.value})`
})

const r = 44
const c = 2 * Math.PI * r
const offset = c / 4

/** 圆周 */
const dashArray = computed(() => {
  const dashLen = (c * percentage.value) / 100
  return `${dashLen}, ${c - dashLen}`
})
</script>
