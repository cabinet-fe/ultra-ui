<template>
  <div :class="nodeClass" :style="style" @click="toggleNodeExpand">
    <u-icon
      v-if="!node.isLeaf"
      :class="expandClass"
      @click.stop="treeEmit('expand', node)"
    >
      <CaretRight />
    </u-icon>

    <i v-else style="display: inline-block; width: 14px; height: 14px" />

    {{ node.value[treeProps.labelKey!] }}
  </div>

  <template v-if="node.children && node.expanded">
    <UTreeNode v-for="child of node.children" :node="child" />
  </template>
</template>

<script lang="ts" setup generic="Val extends Record<string, any>">
import { CustomTreeNode } from './tree-node'
import { TreeDIKey } from './di'
import { computed, inject } from 'vue'
import { bem, withUnit } from '@ui/utils'
import UTreeNode from './tree-node.vue'
import { UIcon } from '../icon'
import { CaretRight } from 'icon-ultra'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<{
  node: CustomTreeNode<Val>
}>()

const { treeProps, treeEmit, cls } = inject(TreeDIKey)!

/** 行class */
const nodeClass = computed(() => {
  return [cls.e('node'), bem.is('active', props.node.active)]
})

const style = computed(() => {
  return {
    paddingLeft: withUnit(props.node.depth * 20 - 20, 'px')
  }
})

const expandClass = computed(() => {
  return [cls.e('expand-icon'), bem.is('expanded', props.node.expanded)]
})

// const handleExpandIconClick = (e: MouseEvent, node) => {
//   e.stopPropagation()
//   props.node.expanded = !props.node.expanded
// }

const toggleNodeExpand = _ => {
  if (!treeProps.expandOnClickNode) return

  props.node.expanded = !props.node.expanded
  console.log(props.node.expanded, 'props.node.expanded')

  treeEmit('expand', props.node)
  treeEmit('node-click', props.node)
}
</script>
