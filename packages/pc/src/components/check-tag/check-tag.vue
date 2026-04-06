<template>
  <div :class="classList" @click="handleChange">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { CheckTagEmits, CheckTagProps } from '@ultra-ui/pc/types'
import { bem } from '@ultra-ui/core'
import { computed } from 'vue'

defineOptions({
  name: 'CheckTag'
})

const cls = bem('check-tag')

const props = withDefaults(defineProps<CheckTagProps>(), {})

const emits = defineEmits<CheckTagEmits>()

const classList = computed(() => {
  return [cls.b, bem.is('checked', props.checked)]
})

const handleChange = () => {
  emits('update:modelValue', props.checked)
}
</script>
