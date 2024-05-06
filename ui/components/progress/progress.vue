<template>
  <div :class="cls.b">
    <div :class="cls.e('bar')" :style="{ width: percentage + '%' }"></div>
    <span :class="classType" :style="{ left: percentage - 2 + '%' }"> {{ percentage }}% </span>
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
  type: 'primary'
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
  return [cls.e('percentage'), cls.m('color' + props.type)]
})
console.log(percentage.value, 'percentage')
</script>
