<template>
  <div :class="classList">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { CardProps } from './card.type'
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

  return [
    cls.b,
    cls.m(props.size),
  ]
})

provide(CardDIKey, { cls, cardProps: props })
</script>
