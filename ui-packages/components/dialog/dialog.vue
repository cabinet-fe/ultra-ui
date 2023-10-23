<template>
  <div :class="cls.b"></div>
</template>

<script lang="ts" setup>
import type { DialogProps } from '@ui/types/components/dialog'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Dialog'
})

defineProps<DialogProps>()

const cls = bem('dialog')
</script>
