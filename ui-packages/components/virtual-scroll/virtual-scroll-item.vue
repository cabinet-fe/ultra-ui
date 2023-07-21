<template>
  <div :class="cls.b" style="height: 32px; white-space: nowrap;">
    <slot v-bind="{ item }" />
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { VirtualScrollDIKey } from './di'

defineOptions({
  name: 'UVirtualScrollItem'
})

defineProps<{
  item: any
}>()

const { cls } = inject(VirtualScrollDIKey)!
</script>
