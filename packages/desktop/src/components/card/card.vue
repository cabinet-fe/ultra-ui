<template>
  <div :class="classList" :style="styles">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
import { computed, provide } from 'vue'

import type { CardProps } from '../../types'
import { CardDIKey } from './di'

defineOptions({
  name: 'Card'
})

const props = defineProps<CardProps>()

const cls = bem('card')

const { size } = useFormFallbackProps([props], { size: 'default' })

const classList = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('integrate', props.integrate)]
})

const styles = computed(() => {
  return {
    width: withUnit(props.width, 'px')
  }
})

provide(CardDIKey, { cls, cardProps: props })
</script>
