<template>
  <u-scroll
    @scroll="handleScroll"
    v-bind="scrollProps"
    ref="scrollRef"
    :class="cls.b"
    :container-class="cls.e('container')"
  >
    <!-- 实际呈现的内容 -->
    <template #content v-if="virtualization">
      <component :is="tag" ref="contentRef" :class="cls.e('content')">
        <template v-for="item of visibleItems" :key="item.id">
          <slot v-bind="{ item }" />
        </template>
      </component>
    </template>

    <template #default>
      <!-- 用于撑开滚动条 -->
      <div
        :class="cls.e('spacer')"
        :style="{ height: spacerHeight }"
        v-if="virtualization"
      ></div>

      <component v-else :is="tag" ref="contentRef" :class="cls.e('content')">
        <template v-for="item of visibleItems" :key="item.id">
          <slot v-bind="{ item }" />
        </template>
      </component>
    </template>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { computed, nextTick, provide, shallowRef, watch } from 'vue'
import { UScroll, type ScrollExposed } from '../scroll'
import type { VirtualScrollProps } from '@ui/types/components/virtual-scroll'
import { bem } from '@ui/utils'
import { VirtualScrollDIKey } from './di'
import { obj } from 'cat-kit/fe'
import { useVisibleItems } from './use-visible-items'

defineOptions({
  name: 'VirtualScroll'
})

const props = withDefaults(defineProps<VirtualScrollProps<DataItem>>(), {
  tag: 'div',
  placeTag: 'div',
  bufferSize: 5,
  data: () => [],
  threshold: 200,
  direction: 'vertical'
})

defineSlots<{
  default(props: { item: DataItem }): any
}>()

const scrollProps = computed(() => obj(props).pick(['height']))

const cls = bem('virtual-scroll')

provide(VirtualScrollDIKey, {
  cls
})

/** 滚动ref */
const scrollRef = shallowRef<ScrollExposed>()
const contentRef = shallowRef<HTMLElement>()

/** 是否虚拟化 */
const virtualization = computed(() => {
  return props.data && props.data.length > props.threshold!
})

/** 占位符高度 */
const spacerHeight = computed<string | undefined>(() => {
  const { data, itemSize = 32 } = props
  if (virtualization.value && data?.length) {
    return data.length * itemSize + 'px'
  }
  return undefined
})

// 实时更新渲染数据
const { handleScroll, visibleItems } = useVisibleItems({
  props,
  virtualization,
  contentRef,
  scrollContainer: computed(() => scrollRef.value?.containerRef)
})

// 更新滚动条
watch([scrollRef, virtualization, () => props.data], ([scrollRef]) => {
  // 等数据渲染完之后更新滚动条
  nextTick(() => scrollRef?.update())
})
</script>
