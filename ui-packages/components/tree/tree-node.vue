<template>
  <div :class="cls.e('node')" :style="style" @click="toggleExpand">
    <u-icon v-if="showExpandIcon" :class="expandClass">
      <CaretRight />
    </u-icon>

    <i v-else style="display: inline-block; width: 14px; height: 14px" />

    {{ nodeRef.value[treeProps.labelKey!] }}
  </div>

  <template v-if="nodeRef.children && nodeRef.expanded">
    <UTreeNode v-for="child of nodeRef.children" :node="child" />
  </template>
</template>

<script lang="ts" setup generic="Val extends Record<string, any>">
import { CustomTreeNode } from './tree-node'
import { TreeDIKey } from './di'
import { computed, inject, shallowReactive } from 'vue'
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

const nodeRef = shallowReactive(props.node)

const { treeProps, cls } = inject(TreeDIKey)!

const style = computed(() => {
  return {
    paddingLeft: withUnit(props.node.depth * 20 - 20, 'px')
  }
})

const showExpandIcon = computed(() => {
  const { node } = props

  return !node.isLeaf
})

const expandClass = computed(() => {
  return [cls.e('expand-icon'), bem.is('expanded', nodeRef.expanded)]
})

const toggleExpand = () => {
  nodeRef.expanded = !nodeRef.expanded
}
</script>
