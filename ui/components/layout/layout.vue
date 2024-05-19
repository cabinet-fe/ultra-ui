<template>
  <component :is="tag" :class="cls.b" :style="style" ref="containerRef">
    <slot />

    <!-- 竖向调节 -->
    <ULayoutResizer
      v-for="(offset, index) in verticalResizerOffsets"
      :key="index"
      :offset="offset"
      direction="vertical"
      @resize="handleResize($event, index)"
      @resize-start="handleStartResize(index)"
      @resize-end="resizing = false"
    />

    <!-- 横向调节 -->
    <ULayoutResizer
      v-for="item in horizontalResizerList"
      :key="item"
      direction="horizontal"
    />
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
  ref
} from 'vue'
import ULayoutResizer from './layout-resizer.vue'
import { LayoutDIKey } from './di'

defineOptions({
  name: 'Layout'
})

const props = withDefaults(defineProps<LayoutProps>(), {
  tag: 'div'
})

const cls = bem('layout')

const colsArr = ref<string[]>([])

watchEffect(() => {
  const { cols } = props
  if (!cols) {
    colsArr.value = []
    return
  }
  colsArr.value = typeof cols === 'string' ? cols.split(' ') : cols
})

const style = computed<CSSProperties>(() => {
  const { rows, gap, resizable } = props
  return {
    gridTemplateColumns: colsArr.value.join(' '),
    gridTemplateRows: rows
      ? typeof rows === 'string'
        ? rows
        : rows.join(' ')
      : '',
    columnGap: resizable ? '6px' : withUnit(gap, 'px')
  }
})

const containerRef = shallowRef<HTMLElement>()

const verticalResizerOffsets = computed<number[]>(() => {
  if (!containerRef.value || !props.resizable) return []

  return colsArr.value.slice(0, -1).map((_, index) => {
    const dom = containerRef.value?.children[index] as HTMLElement
    if (!dom) return 0
    return dom.offsetLeft + dom.offsetWidth
  })
})
const horizontalResizerList = []

const resizing = shallowRef(false)

let prevSize = '0'
let nextSize = '0'
const handleStartResize = (index: number) => {
  prevSize = colsArr.value[index]!
  nextSize = colsArr.value[index + 1]!
  resizing.value = true
}
const handleResize = (offset: number, index: number) => {

  if (prevSize?.endsWith('px')) {
    colsArr.value[index] = `${parseInt(prevSize) + offset}px`
  }
  if (nextSize?.endsWith('px')) {
    colsArr.value[index + 1] = `${parseInt(nextSize) - offset}px`
  }
}

provide(LayoutDIKey, {
  cls
})
</script>
