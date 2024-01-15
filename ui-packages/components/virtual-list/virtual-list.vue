<template>
  <u-scroll @scroll="handleScroll" v-bind="scrollProps" ref="scrollRef">
    <component :is="tag" ref="containerRef">
      <template v-for="item of renderList" :key="item.id">
        <slot v-bind="{ item }" />
      </template>
    </component>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { computed, provide, shallowRef, watch } from 'vue'
import { UScroll } from '../scroll'
import type { VirtualListProps } from '@ui/types/components/virtual-list'
import type { ScrollPosition } from '@ui/types/components/scroll'
import { bem } from '@ui/utils'
import { VirtualListDIKey } from './di'
import { debounce, obj } from 'cat-kit/fe'
import { useContainerHeight } from './use-container-height'

defineOptions({
  name: 'VirtualScroll'
})

const props = withDefaults(defineProps<VirtualListProps>(), {
  tag: 'div',
  placeTag: 'div'
})

const scrollProps = computed(() => obj(props).pick(['height']))

const cls = bem('virtual-list')

provide(VirtualListDIKey, {
  cls
})

/** 容器ref */
const containerRef = shallowRef<HTMLDivElement>()

useContainerHeight({
  props,
  containerRef
})

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
  let start = Math.floor(position.y / (itemSize ?? 32))
  renderStart.value = start
  renderList.value = data.slice(start, start + renderNumber.value + 100)
  console.log(renderList.value[0])
}

const scrollRef = shallowRef()

const scroll = debounce((position: Required<ScrollPosition>) => {
  containerRef.value!.style.paddingTop = `${position.y}px`
  containerRef.value!.style.paddingLeft = `${position.x}px`
}, 50)
const handleScroll = (position: Required<ScrollPosition>) => {
  // scroll(position)

  getRenderList(position)
}
</script>
