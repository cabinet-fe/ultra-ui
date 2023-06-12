<template></template>

<script lang="ts" setup>
import { TipProps } from './tip.type'

// 此组件要在父组件消失时同时消失

defineOptions({
  name: 'UTip'
})

defineProps<TipProps>()
</script>
