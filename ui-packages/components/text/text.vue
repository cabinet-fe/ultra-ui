<template>
  <p :class="classList" :style="style">
    <slot />
  </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { TextProps } from './text.type'
import { bem, withUnit } from '@ui/utils'

defineOptions({
  name: 'Text'
})

const props = withDefaults(defineProps<TextProps>(), {
  role: 'content'
})

const cls = bem('text')

const classList = computed(() => {
  return [cls.b, bem.is(props.role)]
})

const style = computed(() => {
  return {
    fontSize: withUnit(props.fontSize, 'px')
  }
})
</script>
