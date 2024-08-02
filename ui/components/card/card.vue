<template>
  <div :class="classList" :style="styles">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type { CardExposed, CardProps } from '@ui/types/components/card'
import { computed, provide } from 'vue'
import { CardDIKey } from './di'
import { useFormFallbackProps } from '@ui/compositions'

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

defineExpose<CardExposed>({})
</script>
