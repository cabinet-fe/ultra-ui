<template>
  <div :class="classList">
    <div v-if="title" :class="cls.e('header')">{{ title }}</div>

    <ul v-if="items.length" :class="cls.e('list')">
      <li v-for="(item, i) of items" :key="i" :class="cls.e('row')">
        <div :class="cls.e('label')">{{ item.label }}</div>
        <div :class="cls.e('content')">
          <component :is="item.vnode" />
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, useSlots, type VNode } from 'vue'

import type { DescriptionsProps } from '../../types/descriptions'
import UDescriptionsItem from './descriptions-item.vue'

defineOptions({ name: 'Descriptions' })

const props = defineProps<DescriptionsProps>()

const cls = bem('descriptions')

const slots = useSlots()

interface DescriptionItem {
  label: string | undefined
  vnode: VNode
}

// 插槽 vnode 须在渲染路径读取：插槽内容读取的响应式数据经调用链追踪，内容变化时重新计算。
// 移动端单列形态不按 column 分组，逐项纵向堆叠（column 语义保留，不影响窄屏布局）
const items = computed<DescriptionItem[]>(() => {
  return (slots.default?.() ?? [])
    .filter((vnode) => vnode.type === UDescriptionsItem)
    .map((vnode) => ({ label: vnode.props?.label as string | undefined, vnode }))
})

const classList = computed(() => [
  cls.b,
  cls.m(props.layout ?? 'horizontal'),
  cls.m(props.size ?? 'default'),
  bem.is('bordered', !!props.border)
])
</script>
