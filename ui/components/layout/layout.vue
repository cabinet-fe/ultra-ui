<template>
  <component :is="tag" :class="cls.b" :style="style" ref="containerRef">
    <slot />

    <!-- 竖向调节 -->
    <ULayoutResizer
      v-for="(offset, index) of resizerOffsets"
      :offset="offset"
      :key="index"
      ref="resizerRefs"
      direction="vertical"
      @resize="handleResize($event, index)"
      @resize-start="handleStartResize(index)"
    >
    </ULayoutResizer>

    <!-- 横向调节 -->
    <!-- <ULayoutResizer
      v-for="item in horizontalResizerList"
      :key="item"
      direction="horizontal"
    /> -->
  </component>
</template>

<script lang="ts" setup>
import type { LayoutProps } from '@ui/types/components/layout'
import { bem, withUnit } from '@ui/utils'
import {
  computed,
  shallowRef,
  type CSSProperties,
  provide,
  watchEffect,
  ref,
  watch,
  nextTick
} from 'vue'
import ULayoutResizer from './layout-resizer.vue'
import { LayoutDIKey } from './di'
import { useResizeObserver } from '@ui/compositions'

defineOptions({
  name: 'Layout'
})

const props = withDefaults(defineProps<LayoutProps>(), {
  tag: 'div'
})

const cls = bem('layout')

const templateCols = ref<string[]>([])

watchEffect(() => {
  const { cols } = props
  if (!cols) {
    templateCols.value = []
    return
  }
  templateCols.value = typeof cols === 'string' ? cols.split(' ') : cols
})

const style = computed<CSSProperties>(() => {
  const { rows, gap, resizable } = props
  return {
    gridTemplateColumns: templateCols.value.join(' '),
    gridTemplateRows: rows
      ? typeof rows === 'string'
        ? rows
        : rows.join(' ')
      : '',
    columnGap: resizable ? '10px' : withUnit(gap, 'px')
  }
})

const containerRef = shallowRef<HTMLElement>()
const resizerRefs = shallowRef<InstanceType<typeof ULayoutResizer>[]>([])

const resizerOffsets = ref<number[]>([])

function getResizeOffsets() {
  const container = containerRef.value
  if (!props.resizable || !container || !props.cols) {
    return (resizerOffsets.value = [])
  }

  resizerOffsets.value = templateCols.value.slice(0, -1).map((_, index) => {
    const dom = container.children[index] as HTMLElement
    if (!dom) return 0
    return dom.offsetLeft + dom.offsetWidth
  })
}

watch([() => props.resizable, containerRef, () => props.cols], () => {
  nextTick(() => {
    getResizeOffsets()
  })
})

useResizeObserver({
  targets: containerRef,
  onResize() {
    getResizeOffsets()
    resizerRefs.value.forEach((r, i) => {
      r.update(resizerOffsets.value![i]!)
    })
  }
})

// const horizontalResizerList = []

// const resizing = shallowRef(false)

let prevSize = '0'
let nextSize = '0'
const handleStartResize = (index: number) => {
  prevSize = templateCols.value[index]!
  nextSize = templateCols.value[index + 1]!
  // resizing.value = true
}
const handleResize = (offset: number, index: number) => {
  if (prevSize?.endsWith('px')) {
    templateCols.value[index] = `${parseInt(prevSize) + offset}px`
  }
  if (nextSize?.endsWith('px')) {
    templateCols.value[index + 1] = `${parseInt(nextSize) - offset}px`
  }
}

provide(LayoutDIKey, {
  cls
})
</script>
