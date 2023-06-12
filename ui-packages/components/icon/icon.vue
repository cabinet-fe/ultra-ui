<template>
  <i :class="cls.b" v-bind="$attrs">
    <slot></slot>
  </i>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { IconProps } from './icon.type'

defineOptions({
  name: 'UIcon'
})

defineProps<IconProps>()

const cls = bem('icon')
</script>
