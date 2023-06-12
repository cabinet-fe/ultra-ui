<template>
  <div :class="cls.b">
    <div :class="cls.e('header')" v-if="title || slots.header">
      <slot name="header">
        {{ title }}
      </slot>
    </div>
    <div :class="cls.e('body')">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import { CardProps } from './card.type'
import { VNode } from 'vue'

defineOptions({
  name: 'UCard'
})
// TODO测试属性继承是否生效

const slots = defineSlots<{
  /** 头部插槽, 如果指定将会覆盖title */
  header?: () => VNode[]
  /** 默认插槽 */
  default: () => VNode[]
}>()

defineProps<CardProps>()

const cls = bem('card')
</script>
