<template>
  <slot />
</template>

<script lang="ts" setup>
import { PopupProps } from './popup.type'
import { zIndex } from '@ui/utils'

defineOptions({
  name: 'UPopup'
})

defineProps<PopupProps>()

defineExpose({
  zIndex
})
</script>
