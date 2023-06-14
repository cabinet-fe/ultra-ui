<template>
  <div :class="className" :style="style">
    <!-- 实际滚动的容器 -->
    <component
      ref="containerRef"
      :class="cls.e('container')"
      :is="tag"
      v-bind="$attrs"
      @scroll="handleScroll"
    >
      <slot />
    </component>

    <u-scrollbar-x ref="barX" />
    <u-scrollbar-y ref="barY" />
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type {
  ScrollPosition,
  ScrollbarExposed,
  ScrollbarProps
} from './scrollbar.type'
import { CSSProperties, computed, shallowRef } from 'vue'
import UScrollbarX from './scrollbar-x.vue'
import UScrollbarY from './scrollbar-y.vue'
import type { DefineEvent } from '@ui/utils'

defineOptions({
  name: 'UScrollbar'
})

const props = withDefaults(defineProps<ScrollbarProps>(), {
  tag: 'div'
})

const cls = bem('scrollbar')
const className = computed(() => {
  return [cls.b]
})

const style = computed<CSSProperties>(() => {
  return {
    height: withUnit(props.height, 'px')
  }
})

// 模板引用
const containerRef = shallowRef<HTMLElement>()
const barX = shallowRef<InstanceType<typeof UScrollbarX>>()
const barY = shallowRef<InstanceType<typeof UScrollbarY>>()

// 滚动事件
const handleScroll = (e: DefineEvent<HTMLElement>) => {

  barX.value?.update()
}

// 滚动至------------------------------------------------
const scrollToLeft = (target: number) => {
  const container = containerRef.value
  if (!container) return

  container.scrollTo({
    left: target,
    behavior: 'smooth'
  })
}

const scrollToTop = (target: number) => {
  const container = containerRef.value
  if (!container) return
  container.scrollTo({
    top: target,
    behavior: 'smooth'
  })
}

const scrollTo = (position: ScrollPosition) => {
  if (position.x !== undefined) scrollToLeft(position.x)
  if (position.y !== undefined) scrollToTop(position.x)
}

const exposed: ScrollbarExposed = {
  scrollTo
}

defineExpose(exposed)
</script>
