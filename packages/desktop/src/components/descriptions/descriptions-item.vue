<template>
  <!-- 本组件不自行布局：由 UDescriptions 收集插槽 vnode 后渲染进键值表格 -->
  <slot />
</template>

<script lang="ts" setup>
import type { DescriptionsItemProps } from '../../types'

defineOptions({ name: 'DescriptionsItem' })

defineProps<DescriptionsItemProps>()
</script>
