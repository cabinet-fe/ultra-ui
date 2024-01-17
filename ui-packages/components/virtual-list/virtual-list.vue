<template>
  <u-scroll @scroll="handleScroll" v-bind="scrollProps" ref="scrollRef" :class="cls.b">
    <component :is="tag" ref="containerRef">
      <template v-for="item of renderList" :key="item.id">
        <slot v-bind="{ item }" />
      </template>
    </component>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { computed, provide, shallowRef } from 'vue'
import { UScroll, type ScrollExposed } from '../scroll'
import type { VirtualListProps } from '@ui/types/components/virtual-list'
import { bem } from '@ui/utils'
import { VirtualListDIKey } from './di'
import { obj } from 'cat-kit/fe'
import { useContainerHeight } from './use-container-height'
import { useRenderList } from './use-render-list'

defineOptions({
  name: 'VirtualScroll'
})

const props = withDefaults(defineProps<VirtualListProps<DataItem>>(), {
  tag: 'div',
  placeTag: 'div',
  bufferSize: 5,
  data: () => [],
  virtualThreshold: 200
})

defineSlots<{
  default(props: { item: DataItem }): any
}>()

const scrollProps = computed(() => obj(props).pick(['height']))

const cls = bem('virtual-list')

provide(VirtualListDIKey, {
  cls
})

/** 容器ref */
const containerRef = shallowRef<HTMLDivElement>()

/** 滚动ref */
const scrollRef = shallowRef<ScrollExposed>()

/** 是否虚拟化 */
const virtualization = computed(() => {
  return props.data && props.data.length > props.virtualThreshold!
})

// 更新容器高度
useContainerHeight({
  props,
  containerRef
})

// 实时更新渲染数据
const { handleScroll, renderList } = useRenderList({
  props,
  containerRef,
  scrollRef,
  virtualization
})
</script>
