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
      @resize-end="emit('resize-end', index)"
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
import { useResizeObserver } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
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

import type { LayoutEmits, LayoutProps } from '../../types'
import { LayoutDIKey } from './di'
import ULayoutResizer from './layout-resizer.vue'

defineOptions({ name: 'ULayout' })

const props = withDefaults(defineProps<LayoutProps>(), { tag: 'div' })

const emit = defineEmits<LayoutEmits>()

const cls = bem('layout')

const templateCols = ref<string[]>([])

watchEffect(() => {
  const { cols } = props
  if (!cols) {
    templateCols.value = []
    return
  }
  templateCols.value = typeof cols === 'string' ? cols.split(' ') : [...cols]
})

const style = computed<CSSProperties>(() => {
  const { rows, gap, resizable } = props
  return {
    gridTemplateColumns: templateCols.value.join(' '),
    gridTemplateRows: rows ? (typeof rows === 'string' ? rows : rows.join(' ')) : '',
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
    syncResizers()
  })
})

useResizeObserver({
  targets: containerRef,
  onResize() {
    syncResizers()
  }
})

/** 重新测量各列边界并同步所有拖拽手柄位置（容器尺寸或 cols 程序化变化后调用） */
function syncResizers() {
  getResizeOffsets()
  resizerRefs.value.forEach((r, i) => {
    r.update(resizerOffsets.value![i]!)
  })
}

// const horizontalResizerList = []

// const resizing = shallowRef(false)

let prevSize = 0
let nextSize = 0
const handleStartResize = (index: number) => {
  const container = containerRef.value
  if (!container) return

  // 拖拽前把相邻两列按实际渲染宽度固定成 px，
  // 这样拖拽时两列等量增减、容器整体宽度保持不变。
  const prevDom = container.children[index] as HTMLElement | undefined
  const nextDom = container.children[index + 1] as HTMLElement | undefined
  prevSize = prevDom ? prevDom.getBoundingClientRect().width : 0
  nextSize = nextDom ? nextDom.getBoundingClientRect().width : 0
  emit('resize-start', index)
}
const handleResize = (offset: number, index: number) => {
  // 钳位到 [colMin-prevSize, nextSize-colMin]，避免轨道尺寸出现负值或小于列最小宽度——
  // 一旦 grid-template-columns 中带负值，整条声明会被浏览器丢弃。
  const minPrev = props.colMinSizes?.[index] ?? 0
  const minNext = props.colMinSizes?.[index + 1] ?? 0
  const clamped = Math.max(minPrev - prevSize, Math.min(nextSize - minNext, offset))
  templateCols.value[index] = `${prevSize + clamped}px`
  templateCols.value[index + 1] = `${nextSize - clamped}px`
}

provide(LayoutDIKey, { cls })
</script>
