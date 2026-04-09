<template>
  <div :class="cls.b">
    <slot v-bind="{ props }" />
  </div>
</template>

<script lang="ts" setup>
import type { ButtonProps } from '@ultra-ui/desktop'
import { bem } from '@ultra-ui/utils'

defineOptions({
  name: 'ButtonGroup'
})

const props = defineProps<ButtonProps>()

const cls = bem('button-group')

defineSlots<{
  default: (props: { props: ButtonProps }) => any
}>()
</script>
