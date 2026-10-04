<template>
  <div :class="classList" role="separator" :aria-orientation="direction">
    <span v-if="slots.default" :class="cls.e('text')">
      <slot />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, useSlots } from 'vue'

import type { DividerProps } from '../../types/divider'

defineOptions({ name: 'Divider' })

const { direction = 'horizontal', dashed = false, align = 'center' } = defineProps<DividerProps>()

const slots = useSlots()
const cls = bem('divider')

const classList = computed(() => [
  cls.b,
  cls.m(direction),
  bem.is('dashed', dashed),
  bem.is('with-text', !!slots.default),
  slots.default && cls.m(align)
])
</script>
