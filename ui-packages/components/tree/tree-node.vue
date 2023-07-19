<template>
  <div :class="cls.e('node')" :style="style">
    <u-icon v-if="showExpandIcon" :class="expandClass" @click="toggleExpand">
      <CaretRight />
    </u-icon>
    <i v-else style="display: inline-block; width: 14px; height: 14px"></i>

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
  name: 'UTreeNode'
})

const props = defineProps<{
  node: CustomTreeNode<Val>
}>()

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
  return [cls.e('expand-icon'), bem.is('expanded', props.node.expanded)]
})

const toggleExpand = () => {
  props.node.expanded = !props.node.expanded
}
</script>
