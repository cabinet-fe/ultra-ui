<template>
  <component
    v-for="node of getSlotsNodes($slots, max)"
    :key="node.key"
    :is="node"
  />
</template>

<script lang="ts" setup>
import { getSlotsNodes } from './helper'
import type { ActionGroupProps } from '@ui/types/components/action'

defineOptions({
  name: 'ActionGroup',
  inheritAttrs: false
})

withDefaults(defineProps<ActionGroupProps>(), {
  max: 3
})
</script>
