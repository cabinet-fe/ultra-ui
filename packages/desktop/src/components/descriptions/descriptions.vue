<template>
  <div :class="classList">
    <div v-if="title" :class="cls.e('header')">{{ title }}</div>

    <table v-if="rows.length" :class="cls.e('table')">
      <tbody>
        <template v-for="(row, rowIndex) of rows" :key="rowIndex">
          <template v-if="isVertical">
            <tr>
              <th v-for="(item, i) of row" :key="i" :class="cls.e('label')">
                {{ item.label }}
              </th>
            </tr>
            <tr>
              <td v-for="(item, i) of row" :key="i" :class="cls.e('content')">
                <component :is="item.vnode" />
              </td>
            </tr>
          </template>
          <tr v-else>
            <template v-for="(item, i) of row" :key="i">
              <th :class="cls.e('label')">{{ item.label }}</th>
              <td :class="cls.e('content')">
                <component :is="item.vnode" />
              </td>
            </template>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, useSlots, type VNode } from 'vue'

import type { ComponentSize, DescriptionsProps } from '../../types'
import UDescriptionsItem from './descriptions-item.vue'

defineOptions({ name: 'Descriptions' })

const props = defineProps<DescriptionsProps>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('descriptions')

const slots = useSlots()

interface DescriptionItem {
  label: string | undefined
  vnode: VNode
}

// 插槽 vnode 须在渲染路径读取：插槽内容读取的响应式数据经调用链追踪，内容变化时重新计算
const rows = computed<DescriptionItem[][]>(() => {
  const items = (slots.default?.() ?? []).filter((vnode) => vnode.type === UDescriptionsItem)
  const column = Math.max(1, Math.trunc(props.column ?? 3))

  const grouped: DescriptionItem[][] = []
  for (let i = 0; i < items.length; i += column) {
    grouped.push(
      items
        .slice(i, i + column)
        .map((vnode) => ({ label: vnode.props?.label as string | undefined, vnode }))
    )
  }
  return grouped
})

const isVertical = computed(() => props.layout === 'vertical')

const classList = computed(() => [
  cls.b,
  cls.m(props.layout ?? 'horizontal'),
  cls.m(size.value),
  bem.is('bordered', !!props.border)
])
</script>
