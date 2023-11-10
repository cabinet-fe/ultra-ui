<template></template>

<script lang="ts" setup>
import type { TipProps } from '@ui/types/components/tip'

// 此组件要在父组件消失时同时消失

defineOptions({
  name: 'Tip'
})

defineProps<TipProps>()
</script>
