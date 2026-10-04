<template>
  <!-- 本组件不自行布局：由 UDescriptions 收集插槽 vnode 后渲染进单列键值列表 -->
  <slot />
</template>

<script lang="ts" setup>
import type { DescriptionsItemProps } from '../../types/descriptions'

defineOptions({ name: 'UDescriptionsItem' })

defineProps<DescriptionsItemProps>()
</script>
