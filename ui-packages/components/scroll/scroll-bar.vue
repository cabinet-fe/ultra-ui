<template>
  <div v-show="!!size" ref="domRef" :style="style" :class="className"></div>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { useDrag } from '@ui/compositions'
import { ScrollDIKey } from './di'
import { bem } from '@ui/utils'

defineOptions({
  name: 'UScrollBar'
})

const props = defineProps<{
  type: 'x' | 'y'
}>()

const emit = defineEmits<{
  drag: [offset: number, size: number]
}>()

const size = shallowRef(0)
const offset = shallowRef(0)
let currentSize = 0
let maxOffset = 0

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

const getTarget =
  props.type === 'x'
    ? (x: number, y: number) => currentSize + x
    : (x: number, y: number) => currentSize + y

useDrag({
  target: domRef,
  onDragStart() {
    currentSize = offset.value
    dragging.value = true
  },
  onDragEnd() {
    dragging.value = false
  },
  onDrag(x, y) {
    const target = getTarget(x, y)
    if (target < 0) {
      offset.value = 0
    } else if (target > maxOffset) {
      offset.value = maxOffset
    } else {
      offset.value = target
    }

    emit('drag', offset.value, size.value)
  }
})

defineExpose({
  update(_size: number, _offset: number) {
    size.value = _size
    offset.value = _offset
  },
  setMaxOffset(offset: number) {
    maxOffset = offset
  }
})
</script>
