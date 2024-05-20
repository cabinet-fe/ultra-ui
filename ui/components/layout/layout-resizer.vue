<template>
  <div
    :class="className"
    :style="{
      transform: `translate3d(${offsets.x}, ${offsets.y}, 0)`,
      zIndex: z
    }"
    ref="resizerRef"
  >
    <u-icon :size="10"> <Move /> </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, shallowReactive, shallowRef } from 'vue'
import { LayoutDIKey } from './di'
import { bem, zIndex } from '@ui/utils'
import { useDrag } from '@ui/compositions'
import { Move } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'LayoutResizer'
})

const z = zIndex()

const props = defineProps<{
  /** 是否横向 */
  horizontal?: boolean
  /** 默认偏移量 */
  offset?: number
}>()

const emit = defineEmits<{
  (e: 'resize', offset: number): void
  (e: 'resize-start'): void
  (e: 'resize-end'): void
}>()

const { cls } = inject(LayoutDIKey)!

const className = computed(() => {
  return [cls.e('resizer'), bem.is('horizontal', props.horizontal)]
})

const resizerRef = shallowRef<HTMLDivElement>()

let offset = props.offset ?? 0
const offsets = shallowReactive({
  x: props.horizontal ? '0' : offset + 'px',
  y: props.horizontal ? offset + 'px' : '0'
})
let currentOffset = 0
useDrag({
  target: resizerRef,
  onDragStart() {
    currentOffset = offset
    emit('resize-start')
  },
  onDrag(x, y) {
    if (!props.horizontal) {
      offset = currentOffset + x
      offsets.x = offset + 'px'
      emit('resize', x)
    } else {
      offset = currentOffset + y
      offsets.y = offset + 'px'
      emit('resize', y)
    }
  },
  onDragEnd() {
    emit('resize-end')
  }
})

defineExpose({
  update(_offset: number) {
    offset = _offset
    if (!props.horizontal) {
      offsets.x = offset + 'px'
    } else {
      offsets.y = offset + 'px'
    }
  }
})
</script>
