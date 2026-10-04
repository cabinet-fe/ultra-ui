<template>
  <div :class="cls.b">
    <component :is="item" v-for="(item, index) of shownItems" :key="index" />
    <span v-if="restCount > 0" :class="cls.e('rest')">+{{ restCount }}</span>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, useSlots } from 'vue'

import type { AvatarGroupProps } from '../../types'

defineOptions({ name: 'UAvatarGroup' })

const props = defineProps<AvatarGroupProps>()

const cls = bem('avatar-group')

const slots = useSlots()

// 插槽 vnode 须在渲染路径读取：插槽内容读取的响应式数据经调用链追踪，内容变化时重新计算
const items = computed(() => slots.default?.() ?? [])
const shownItems = computed(() => (props.max ? items.value.slice(0, props.max) : items.value))
const restCount = computed(() => (props.max ? Math.max(items.value.length - props.max, 0) : 0))
</script>
