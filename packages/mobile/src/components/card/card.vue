<template>
  <div :class="classList" :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { withUnit } from '@veltra/utils'
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { CardProps } from '../../types/card'

defineOptions({ name: 'UCard' })

const { width, integrate, size } = defineProps<CardProps>()

const cls = bem('card')

// 移动端没有 header/content/action 子区块，尺寸档位直接作用于根节点（字号 + 内边距密度）
const classList = computed(() => [cls.b, cls.m(size ?? 'default'), bem.is('integrate', integrate)])

const style = computed(() => ({ width: withUnit(width, 'px') }))
</script>
