<template>
  <div :class="classList" :style="styles">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type { CardExposed, CardProps } from './card.type'
import { computed, provide } from 'vue'
import { CardDIKey } from './di'

defineOptions({
  name: 'Card'
})

const props = withDefaults(defineProps<CardProps>(), {
  size: 'default'
})

const cls = bem('card')

const classList = computed(() => {
  return [cls.b, cls.m(props.size)]
})

const styles = computed(() => {
  return {
    width: withUnit(props.width, 'px')
  }
})

provide(CardDIKey, { cls, cardProps: props })

defineExpose<CardExposed>({})
</script>
