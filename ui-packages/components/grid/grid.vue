<template>
  <component :is="tag" :class="cls.b" :style="style">
    <UNodeRender :content="renderSlots()" />
  </component>
</template>

<script lang="ts" setup>
import { bem, isFragment } from '@ui/utils'
import type { GridProps } from '@ui/types/components/grid'
import {
  type CSSProperties,
  type VNodeArrayChildren,
  cloneVNode,
  computed,
  useSlots,
  isVNode
} from 'vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Grid'
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
 * 获取除片段以外的vnode
 * @param vNodes
 */
const getNormalNode = (vNodes: VNodeArrayChildren) => {
  let result: VNodeArrayChildren = []
  for (let i = 0; i < vNodes.length; i++) {
    const node = vNodes[i]!
    if (isVNode(node) && isFragment(node) && Array.isArray(node.children)) {
      result = result.concat(getNormalNode(node.children))
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
