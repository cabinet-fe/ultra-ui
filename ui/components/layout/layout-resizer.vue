<template>
  <div
    :class="className"
    :style="{
      transform: `translate(${direction === 'vertical' ? withUnit(offset ?? 0, 'px') : '0px'})`
      // top: direction === 'horizontal' ? withUnit(offset ?? 0, 'px') : '0px'
    }"
    ref="resizerRef"
  >
    <u-icon :size="14"> <Move /> </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { LayoutDIKey } from './di'
import { bem, withUnit } from '@ui/utils'
import { useDrag } from '@ui/compositions'
import { Move } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'LayoutResizer'
})

const props = defineProps<{
  /** 方向 */
  direction: 'vertical' | 'horizontal'
  /** 偏移量 */
  offset?: number
}>()

const emit = defineEmits<{
  (e: 'resize', offset: number): void
  (e: 'resize-start'): void
  (e: 'resize-end'): void
}>()

const { cls } = inject(LayoutDIKey)!

const className = computed(() => {
  return [cls.e('resizer'), bem.is(props.direction)]
})

const resizerRef = shallowRef<HTMLDivElement>()

const offset = shallowRef(props.offset ?? 0)

let currentOffset = 0
useDrag({
  target: resizerRef,
  onDragStart() {
    currentOffset = offset.value
    emit('resize-start')
  },
  onDrag(x, y) {
    if (props.direction === 'vertical') {
      offset.value = currentOffset + x
    } else if (props.direction === 'horizontal') {
      offset.value = currentOffset + y
    }
    emit('resize', x)
  },
  onDragEnd() {
    emit('resize-end')
  }
})
</script>
