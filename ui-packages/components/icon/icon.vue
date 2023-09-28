<template>
  <i :class="cls.b" :style="style" v-bind="$attrs" @click.stop="emit('click')">
    <slot></slot>
  </i>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { IconProps } from '@ui/types/components/icon'
import { type CSSProperties, computed } from 'vue'
import {  withUnit } from '@ui/utils'

defineOptions({
  name: 'Icon'
})

const emit = defineEmits(['click'])

const props = defineProps<IconProps>()

const cls = bem('icon')

const style = computed<CSSProperties>(() => {
  return {
    fontSize: withUnit(props.size, 'px')
  }
})
</script>
