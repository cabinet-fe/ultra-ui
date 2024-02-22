<template>
  <div :class="className"></div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { LayoutDIKey } from './di'
import { bem } from '@ui/utils'

defineOptions({
  name: 'LayoutResizer'
})

const props = defineProps<{
  /** 方向 */
  direction: 'vertical' | 'horizontal'
}>()

const { cls } = inject(LayoutDIKey)!

const className = computed(() => {
  return [cls.e('resizer'), bem.is(props.direction)]
})
</script>
