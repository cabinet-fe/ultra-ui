<template>
  <component :is="tag" :class="cls.b" :style="style" ref="gridRef">
    <UNodeRender :content="renderSlots()" />
  </component>
</template>

<script lang="ts" setup>
import { bem, isFragment } from '@ui/utils'
import type {
  GridProps,
  GridEmits,
  Breakpoint,
  BreakpointName
} from '@ui/types/components/grid'
import { GridDIKey } from './di'
import {
  type CSSProperties,
  type VNodeArrayChildren,
  cloneVNode,
  computed,
  useSlots,
  isVNode,
  shallowRef,
  watchEffect,
  provide
} from 'vue'
import { UNodeRender } from '../node-render'
import { useResizeObserver, type ResizeObserverReturn } from '@ui/compositions'
import type { Undef } from '@ui/types/helper'

defineOptions({
  name: 'Grid'
})

const props = withDefaults(defineProps<GridProps>(), {
  tag: 'div'
})

const emit = defineEmits<GridEmits>()

const cls = bem('grid')

const slots = useSlots()

const currentBreakpoint = shallowRef<Breakpoint>()

const style = computed<CSSProperties>(() => {
  const { cols, gap } = props
  const styles: CSSProperties = {}
  if (gap) {
    styles.columnGap = gap + 'px'
  }
  if (cols) {
    if (typeof cols === 'number') {
      styles.gridTemplateColumns = `repeat(${cols}, 1fr)`
    } else if (typeof cols === 'function') {
      if (currentBreakpoint.value) {
        styles.gridTemplateColumns = `repeat(${cols(
          currentBreakpoint.value
        )}, 1fr)`
      }
    } else {
      if (currentBreakpoint.value) {
        const breakpoint =
          cols[currentBreakpoint.value.name] || (cols.default ?? 24)
        styles.gridTemplateColumns = `repeat(${breakpoint}, 1fr)`
      }
    }
  }
  return styles
})

/**
 * 排除片段VNode
 * @param vNodes
 */
const excludeFragmentNodes = (vNodes: VNodeArrayChildren) => {
  let result: VNodeArrayChildren = []
  for (let i = 0; i < vNodes.length; i++) {
    const node = vNodes[i]
    if (isVNode(node) && isFragment(node) && Array.isArray(node.children)) {
      result = result.concat(excludeFragmentNodes(node.children))
    } else {
      result.push(node)
    }
  }

  return result
}

const renderSlots = () => {
  const contents = slots.default?.()

  if (!contents) return null
  const vNodes = excludeFragmentNodes(contents)

  const { cols } = props
  if (typeof cols !== 'number') return vNodes

  // 指定栅格
  return vNodes.map(node => {
    if (isVNode(node)) {
      const { span } = (node.props || {}) as { span?: number | 'full' }
      return cloneVNode(node, {
        style: {
          gridColumn:
            span === 'full'
              ? '1 / -1'
              : `span ${span ? (span > cols ? cols : span) : 1} / auto`
        }
      })
    }

    return node
  })
}

const gridRef = shallowRef<HTMLElement>()

/** 是否响应式布局 */
const responsive = shallowRef(false)

/** she */
const setResponsive = (enable: boolean) => {
  responsive.value = enable
}

/**
 * 获取容器断点
 * @param width
 */
const getContainerBreakpoint = (width: number): Breakpoint => {
  let name: BreakpointName
  let level: number
  if (width < 600) {
    name = 'xs'
    level = 1
  } else if (width < 960) {
    name = 'sm'
    level = 2
  } else if (width < 1280) {
    name = 'md'
    level = 3
  } else if (width < 1920) {
    name = 'lg'
    level = 4
  } else {
    name = 'xl'
    level = 5
  }
  return {
    name,
    level,
    width
  }
}

/** 容器尺寸监听器 */
let observer: Undef<ResizeObserverReturn>
watchEffect(() => {
  if (props.cols && typeof props.cols !== 'number') {
    setResponsive(true)
  }

  if (responsive.value) {
    observer = useResizeObserver({
      target: gridRef,
      onResize([entry]) {
        const target = entry!.target as HTMLElement
        const rect = target.getBoundingClientRect()
        currentBreakpoint.value = getContainerBreakpoint(rect.width)
        emit('resize', rect)
      }
    })
  } else {
    observer?.disconnect()
    observer = undefined
  }
})

provide(GridDIKey, {
  setResponsive
})
</script>
