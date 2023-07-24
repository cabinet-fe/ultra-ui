<template>
  <component :is="tag" :class="cls.b" :style="style">
    <UNodeRender :content="renderSlots()" />
  </component>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { GridProps } from './grid.type'
import {
  type CSSProperties,
  type VNodeArrayChildren,
  cloneVNode,
  computed,
  useSlots,
  Fragment,
  Comment,
  isVNode
} from 'vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'UGrid'
})

const props = withDefaults(defineProps<GridProps>(), {
  tag: 'div'
})

const cls = bem('grid')

const slots = useSlots()

const style = computed<CSSProperties>(() => {
  return {
    gridTemplateColumns: Array.isArray(props.cols)
      ? props.cols.join(' ')
      : typeof props.cols === 'string'
      ? props.cols
      : `repeat(${props.cols}, 1fr)`,
    columnGap: props.gap ? props.gap + 'px' : 0
  }
})

/**
 *
 * @param vNodes
 */
const getNormalNode = (vNodes: VNodeArrayChildren) => {
  let result: VNodeArrayChildren = []
  for (let i = 0; i < vNodes.length; i++) {
    const node = vNodes[i]!
    if (isVNode(node)) {
      if (node.type === Fragment || node.type === Comment) {
        if (Array.isArray(node.children)) {
          result = result.concat(getNormalNode(node.children))
        } else {
          result.push(node)
        }
      } else {
        result.push(node)
      }
    } else {
      result.push(node)
    }
  }

  return result
}

const renderSlots = () => {
  const contents = slots.default?.()

  if (!contents) return null

  const vNodes = getNormalNode(contents)

  if (typeof props.cols !== 'number') return vNodes

  return vNodes.map(node => {
    if (isVNode(node)) {
      const { span } = node.props || {}
      return cloneVNode(node, {
        style: {
          gridColumn: span === 'full' ? '1 / -1' : `span ${span || 1} / auto`
        }
      })
    }

    return node
  })
}
</script>
