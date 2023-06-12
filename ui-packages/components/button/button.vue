<template>
  <button type="button" :class="className">
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

const cls = bem('button')

const className = computed(() => {
  return [cls.b, cls.m(props.size), cls.m(props.type)]
})
</script>