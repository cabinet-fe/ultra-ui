<template>
  <div
    :class="classList"
    role="checkbox"
    :aria-checked="currentValue"
    tabindex="0"
    @click="handleChange"
    @keydown.enter.prevent="handleChange"
    @keydown.space.prevent="handleChange"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { CheckTagEmits, CheckTagProps } from '../../types'

defineOptions({ name: 'UCheckTag' })

const cls = bem('check-tag')

const props = withDefaults(defineProps<CheckTagProps>(), {})

const emits = defineEmits<CheckTagEmits>()

const currentValue = computed(() => props.modelValue ?? props.checked ?? false)

const classList = computed(() => {
  return [cls.b, bem.is('checked', currentValue.value)]
})

const handleChange = () => {
  emits('update:modelValue', !currentValue.value)
}
</script>
