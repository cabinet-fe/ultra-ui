<template>
  <u-scroll @scroll="handleScroll" v-bind="scrollProps">
    <component :is="tag" ref="containerRef" :style="{ height }">
      <template v-for="item of renderList">
        <slot v-bind="{ item }" />
      </template>
    </component>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem">
import type { VirtualScrollProps } from './virtual-scroll.type'
import { UScroll, type ScrollPosition } from '../scroll'
import { computed, provide, shallowRef, watch } from 'vue'
import { bem } from '@ui/utils'
import { VirtualScrollDIKey } from './di'
import { obj } from 'cat-kit/fe'

defineOptions({
  name: 'VirtualScroll'
})

const props = withDefaults(defineProps<VirtualScrollProps<DataItem>>(), {
  itemSize: 32,
  tag: 'div'
})

const scrollProps = computed(() => obj(props).pick(['height']))

const cls = bem('virtual-scroll')

provide(VirtualScrollDIKey, {
  cls
})

/** 容器高度 */
const height = computed(() => {
  const total = props.data.length * (props.itemSize ?? 32)
  return total + 'px'
})

const containerRef = shallowRef<HTMLDivElement>()

/** 渲染起始索引 */
const renderStart = shallowRef(0)
const renderNumber = shallowRef(0)
const renderList = shallowRef(
  props.data.slice(renderStart.value, renderStart.value + renderNumber.value)
)

watch(containerRef, container => {
  if (!container?.parentElement) return
  renderNumber.value =
    container.parentElement.offsetHeight / (props.itemSize ?? 32)
})

const getRenderList = (position: Required<ScrollPosition>) => {
  const { itemSize, data } = props
  let start = Math.floor(position.y / itemSize)
  renderStart.value = start
  renderList.value = data.slice(start, start + renderNumber.value)
}

let timer: number

const handleScroll = (position: Required<ScrollPosition>) => {
  containerRef.value!.style.paddingTop = `${position.y}px`
  containerRef.value!.style.paddingLeft = `${position.x}px`

  timer = requestIdleCallback(() => {
    getRenderList(position)
    cancelIdleCallback(timer)
  })
}
</script>
