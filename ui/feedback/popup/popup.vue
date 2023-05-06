<template>

</template>

<script lang="ts" setup>
import { PopupProps } from './popup.type'
import { zIndex  } from '@ui/helper'

defineProps<PopupProps>()

defineExpose({
  zIndex
})
</script>

<script lang="ts">
export default {
  name: 'UPopup'
}
</script>
