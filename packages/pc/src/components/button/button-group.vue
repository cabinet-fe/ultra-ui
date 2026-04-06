<template>
  <div :class="cls.b">
    <slot v-bind="{ props }" />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ultra-ui/core'
import type { ButtonProps } from '@ultra-ui/pc/types'

defineOptions({
  name: 'ButtonGroup'
})

const props = defineProps<ButtonProps>()

const cls = bem('button-group')

defineSlots<{
  default: (props: { props: ButtonProps }) => any
}>()
</script>
