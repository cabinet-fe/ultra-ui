<template>
  <div v-show="!!size" ref="domRef" :style="style" :class="className"></div>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { useDrag } from '@ui/compositions'
import { ScrollDIKey } from './di'
import { bem } from '@ui/utils'

defineOptions({
  name: 'ScrollBar'
})

const props = defineProps<{
  type: 'x' | 'y'
}>()

const emit = defineEmits<{
  drag: [offset: number, size: number]
}>()

/** 滚动条高度(type为x时为宽度) */
const size = shallowRef(0)
/** 滚动条偏移量 */
const offset = shallowRef(0)
/** 滚动条拖拽前偏移量 */
let currentOffset = 0
/** 滚动条轨道尺寸 */
let trackSize = 0

const { cls } = inject(ScrollDIKey)!

const dragging = shallowRef(false)

const className = computed(() => {
  return [cls.e(`bar-${props.type}`), bem.is('active', dragging.value)]
})

const style =
  props.type === 'x'
    ? computed(() => {
        return {
          width: size.value + 'px',
          transform: `translateX(${offset.value}px)`
        }
      })
    : computed(() => {
        return {
          height: size.value + 'px',
          transform: `translateY(${offset.value}px)`
        }
      })

const domRef = shallowRef<HTMLElement>()

/** 获取拖拽偏移量 */
const getDragOffset =
  props.type === 'x'
    ? (x: number, y: number) => currentOffset + x
    : (x: number, y: number) => currentOffset + y

// 应用拖拽
useDrag({
  target: domRef,
  onDragStart() {
    dragging.value = true
    currentOffset = offset.value
  },
  onDragEnd() {
    dragging.value = false
  },
  onDrag(x, y) {
    const newOffset = getDragOffset(x, y)
    const maxOffset = trackSize - size.value

    if (newOffset < 0) {
      offset.value = 0
    } else if (newOffset > maxOffset) {
      offset.value = maxOffset
    } else {
      offset.value = newOffset
    }

    emit('drag', offset.value, size.value)
  }
})

defineExpose({
  /** 更新滚动条状态 */
  update(_size: number, _offset: number) {
    size.value = _size
    offset.value = _offset
  },

  /** 设置轨道尺寸 */
  setTrackSize(size: number) {
    trackSize = size
  }
})
</script>
