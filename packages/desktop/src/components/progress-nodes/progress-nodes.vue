<template>
  <div ref="container" :class="className" :style="containerStyle" @scroll="checkScroll">
    <ul :class="cls.e('list')">
      <li
        v-for="(node, index) in nodes"
        :key="node.key ?? index"
        :class="[
          cls.e('item'),
          bem.is('checked', isChecked(node, index)),
          bem.is('active', isActive(node))
        ]"
        @click="handleClick(node, index)"
      >
        <div :class="cls.e('node')">
          <!-- 虚线连接 -->
          <div v-if="index !== nodes.length - 1" :class="cls.e('link')"></div>

          <!-- 节点圆点 -->
          <span :class="cls.e('dot')">
            <slot name="icon" :node="node" :index="index" />
          </span>
        </div>

        <div :class="cls.e('label')">
          <slot :node="node" :index="index">
            {{ getLabel(node) }}
          </slot>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useDrag, useResizeObserver } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, shallowRef, toRefs, useTemplateRef, watch, nextTick } from 'vue'

import type { ProgressNodesProps, ProgressNodesEmits } from '../../types'

defineOptions({
  name: 'ProgressNodes'
})

const props = withDefaults(defineProps<ProgressNodesProps>(), {
  colorType: 'primary',
  labelKey: 'label',
  valueKey: 'value'
})

const emit = defineEmits<ProgressNodesEmits>()

const { nodes } = toRefs(props)

const cls = bem('progress-nodes')
const containerRef = useTemplateRef('container')
const isDragging = shallowRef(false)
const isScrollable = shallowRef(false)
const showMaskStart = shallowRef(false)
const showMaskEnd = shallowRef(false)

const className = computed(() => [
  cls.b,
  cls.m(props.colorType),
  bem.is('scrollable', isScrollable.value),
  bem.is('dragging', isDragging.value),
  bem.is('mask-start', showMaskStart.value),
  bem.is('mask-end', showMaskEnd.value)
])

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  const maxWidth = toCssSize(props.maxWidth)
  if (maxWidth) style.maxWidth = maxWidth
  return style
})

let startScrollLeft = 0

useDrag({
  target: containerRef,
  onDragStart() {
    if (!isScrollable.value) return
    const container = containerRef.value
    if (!container) return
    isDragging.value = true
    startScrollLeft = container.scrollLeft
  },
  onDrag({ x }) {
    if (!isScrollable.value) return
    const container = containerRef.value
    if (!container) return
    container.scrollLeft = startScrollLeft - x
  },
  onDragEnd() {
    isDragging.value = false
  }
})

useResizeObserver({
  targets: containerRef,
  onResize: checkScroll
})

watch(
  nodes,
  () => {
    nextTick(checkScroll)
  },
  { deep: true }
)

function checkScroll() {
  const container = containerRef.value
  if (!container) return

  const { scrollLeft, scrollWidth, clientWidth } = container
  isScrollable.value = scrollWidth > clientWidth + 1
  showMaskStart.value = scrollLeft > 0
  showMaskEnd.value = scrollLeft + clientWidth < scrollWidth - 1
}

function isChecked(node: Record<string, any>, index: number) {
  return props.check?.(node, index) ?? false
}

function isActive(node: Record<string, any>) {
  const value = o(node).get(props.valueKey)
  return props.modelValue === value
}

function getLabel(node: Record<string, any>) {
  return o(node).get(props.labelKey)
}

function handleClick(node: Record<string, any>, index: number) {
  const value = o(node).get(props.valueKey)
  emit('update:modelValue', value)
  emit('click', node, index)
}

function toCssSize(value?: number | string) {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}
</script>
