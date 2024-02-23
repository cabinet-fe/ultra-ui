<template>
  <component :is="tag" :class="cls.b" :style="style" ref="gridRef">
    <UNodeRender :content="renderSlots()" />
  </component>
</template>

<script lang="ts" setup>
import { bem, isFragment } from '@ui/utils'
import type { GridProps, GridEmits } from '@ui/types/components/grid'
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

const style = computed<CSSProperties>(() => {
  const { cols, gap } = props
  const styles: CSSProperties = {}
  if (gap) {
    styles.columnGap = gap + 'px'
  }
  if (cols) {
    if (Array.isArray(cols)) {
      styles.gridTemplateColumns = cols.join(' ')
    } else if (typeof cols === 'string') {
      styles.gridTemplateColumns = cols
    } else {
      styles.gridTemplateColumns = `repeat(${cols}, 1fr)`
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

/** 容器尺寸监听器 */
let observer: Undef<ResizeObserverReturn>
watchEffect(() => {
  console.log(responsive.value)
  if (responsive.value) {
    observer = useResizeObserver({
      target: gridRef,
      onResize([entry]) {
        const target = entry!.target as HTMLElement
        const rect = target.getBoundingClientRect()
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
