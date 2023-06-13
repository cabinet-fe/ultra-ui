<template>
  <button type="button" :class="className" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { ButtonProps } from './button.type'
import { computed } from 'vue'

defineOptions({
  name: 'UButton'
})

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'default'
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const cls = bem('button')

const className = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    cls.m(props.type),
    bem.is('circle', props.circle)
  ]
})
</script>
