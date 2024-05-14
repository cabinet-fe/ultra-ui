<template>
  <div :class="className" :style="isCircle == true ? { display: 'inline-block' } : ''">
    <!-- 条形进度条 -->
    <div :class="cls.e('line')" v-if="isCircle == false">
      <div :class="colorType" :style="{ width: percentage + '%' }"></div>
      <span :class="cls.e('percentage')" :style="{ left: percentage - 2 + '%' }">
        {{ percentage }}%
      </span>
    </div>

    <!-- 环形进度条 -->
    <div :class="cls.e('circle')" v-else>
      <svg :class="cls.e('svg')" width="100" height="100">
        <circle cx="50" cy="50" r="40" fill="white" stroke="#f5f8fa" stroke-width="5" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          :stroke="stroke"
          stroke-width="5"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
        />
      </svg>

      <template v-if="status == 'success' || status == 'danger' || status == 'warning'">
        <span :class="cls.e('percentage-circle')" v-if="isCircle && status == 'success'">
          <u-icon><Check /></u-icon>
        </span>

        <span :class="cls.e('percentage-circle')" v-else-if="isCircle && status == 'danger'">
          <u-icon><Close /></u-icon>
        </span>

        <span :class="cls.e('percentage-circle')" v-else-if="isCircle && status == 'warning'">
          <u-icon><Warning /></u-icon>
        </span>
      </template>

      <span :class="cls.e('percentage-circle')" v-else>{{ percentage }}%</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProgressProps, ProgressEmits } from '@ui/types/components/progress'
import { bem } from '@ui/utils'
import { computed } from 'vue'
import { UIcon } from '../icon'
import { Check, Close, Warning } from 'icon-ultra'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Progress'
})
const cls = bem('progress')
const props = withDefaults(defineProps<ProgressProps>(), {
  isCircle: false,
  type: 'primary'
})
const emit = defineEmits<ProgressEmits>()
const { formProps } = useFormComponent()
const { size } = useFormFallbackProps([formProps ?? {}, props], { size: 'default' })
const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const percentage = computed(() => {
  if (props.percentage > 100) {
    return 100
  }
  if (props.percentage < 0) {
    return 0
  }
  return props.percentage
})

const colorType = computed(() => {
  return [cls.e('bar'), cls.m('color-' + props.type)]
})

/** 描边 */
const stroke = computed(() => {
  return `var(--color-${props.type}-light-3)`
})

/** 圆周 */
const circumference = computed(() => {
  return 2 * Math.PI * 45
})

const offset = computed(() => {
  return circumference.value * (1 - percentage.value / 100)
  // return circumference.value - (percentage.value / 100) * circumference.value
})
console.log(percentage.value, 'percentage')
console.log(props.type, 'type')
</script>
<style lang="scss" scoped></style>
