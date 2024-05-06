<template>
  <!-- 条形进度条 -->
  <div :class="cls.b">
    <div :class="classType" :style="{ width: percentage + '%' }"></div>
    <span :class="cls.e('percentage')" :style="{ left: percentage - 2 + '%' }">
      {{ percentage }}%
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { ProgressProps, ProgressEmits } from '@ui/types/components/progress'
import { bem } from '@ui/utils'
import { computed } from 'vue'

defineOptions({
  name: 'Progress'
})
const cls = bem('progress')
const props = withDefaults(defineProps<ProgressProps>(), {
  color: 'primary'
})
const emit = defineEmits<ProgressEmits>()

const percentage = computed(() => {
  if (props.percentage > 100) {
    return 100
  }
  if (props.percentage < 0) {
    return 0
  }
  return props.percentage
})

const classType = computed(() => {
  return [cls.e('bar'), cls.m('color-' + props.color)]
})
console.log(percentage.value, 'percentage')
console.log(props.color, 'type')
</script>
