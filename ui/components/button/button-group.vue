<template>
  <div :class="cls.b">
    <slot v-bind="{ props }" />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { ButtonProps } from '@ui/types/components/button'

defineOptions({
  name: 'ButtonGroup'
})

const props = defineProps<ButtonProps>()

const cls = bem('button-group')

defineSlots<{
  default: (props: { props: ButtonProps }) => any
}>()
</script>
