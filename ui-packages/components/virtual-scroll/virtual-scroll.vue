<template>
  <u-scroll @scroll="handleScroll">
    <div :style="{ height }" ref="containerRef">
      <template v-for="item of renderList" :key="item.id">
        <u-virtual-scroll-item
          :item="item"
          :style="{ height: itemSize ?? 30 + 'px' }"
        >
          <template #default="{ item }">
            <slot v-bind="{ item }" />
          </template>
        </u-virtual-scroll-item>
      </template>
    </div>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem">
import type { VirtualScrollProps } from './virtual-scroll.type'
import { UScroll, type ScrollPosition } from '../scroll'
import { computed, provide, shallowRef } from 'vue'
import { bem } from '@ui/utils'
import { VirtualScrollDIKey } from './di'
import UVirtualScrollItem from './virtual-scroll-item.vue'

defineOptions({
  name: 'UVirtualScroll'
})

const props = withDefaults(defineProps<VirtualScrollProps<DataItem>>(), {
  poolSize: 200,
  itemSize: 32
})
const cls = bem('virtual-scroll')

provide(VirtualScrollDIKey, {
  cls
})

const height = computed(() => {
  const total = props.data.length * (props.itemSize ?? 32)
  return total + 'px'
})

const containerRef = shallowRef<HTMLDivElement>()

const prevStartIndex = shallowRef(0)
const renderList = shallowRef(
  props.data.slice(prevStartIndex.value, props.poolSize)
)

const getRenderList = (position: Required<ScrollPosition>) => {
  console.log('rendered')
  const { itemSize, data } = props
  let start = Math.floor(position.y / itemSize)
  prevStartIndex.value = start
  renderList.value = data.slice(start, start + props.poolSize)
}

let timer: number

const handleScroll = (position: Required<ScrollPosition>) => {
  let start = position.y / props.itemSize

  if (start < prevStartIndex.value + props.poolSize - 50) {
    return
  }

  containerRef.value!.style.paddingTop = `${position.y}px`
  containerRef.value!.style.paddingLeft = `${position.x}px`

  timer = requestIdleCallback(() => {
    getRenderList(position)
    cancelIdleCallback(timer)
  })
}
</script>
