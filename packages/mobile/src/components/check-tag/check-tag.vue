<template>
  <div :class="classList" @click="handleChange">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { CheckTagEmits, CheckTagProps } from '../../types/check-tag'

defineOptions({ name: 'UCheckTag' })

const cls = bem('check-tag')

const props = defineProps<CheckTagProps>()

const emits = defineEmits<CheckTagEmits>()

const classList = computed(() => {
  return [
    cls.b,
    bem.is('checked', props.modelValue ?? props.checked),
    bem.is('disabled', props.disabled)
  ]
})

const handleChange = () => {
  if (props.disabled) return
  const next = !(props.modelValue ?? props.checked)
  emits('update:modelValue', next)
  emits('change', next)
}
</script>
