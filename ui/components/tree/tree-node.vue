<template>
  <div :class="nodeClass" :style="style" @click="handleClick">
    <u-icon
      v-if="!node.isLeaf"
      :class="cls.e('expand-icon')"
      @click.stop="toggleExpand"
    >
      <ArrowRight />
    </u-icon>
    <i v-else :class="cls.e('icon-placeholder')" />

    <u-checkbox
      v-if="treeProps.checkable"
      :model-value="checked.has(node.value)"
      :indeterminate="node.indeterminate"
      @update:model-value="handleCheck(node, $event)"
      :disabled="treeProps.disabledNode?.(node.value, node) || false"
    />

    <span :class="cls.e('node-content')">
      <u-node-render :content="getTreeSlotsNode({ node, data: node.value })" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { TreeDIKey } from './di'
import { computed, inject } from 'vue'
import { bem, withUnit } from '@ui/utils'
import { UIcon } from '../icon'
import { ArrowRight } from 'icon-ultra'
import type { TreeNodeProps } from '@ui/types/components/tree'
import UCheckbox from '../checkbox/checkbox.vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<TreeNodeProps>()

const {
  treeProps,
  treeEmit,
  cls,
  selected,
  checked,
  getTreeSlotsNode,
  getFlattedNodes,
  handleCheck,
  handleSelect
} = inject(TreeDIKey)!

/** 行class */
const nodeClass = computed(() => {
  const { node } = props
  return [
    cls.e('node'),
    bem.is('selected', node.value === selected.value),
    bem.is('expanded', node.expanded),
    bem.is('disabled', treeProps.disabledNode?.(node.value, node) || false),
  ]
})

const style = computed(() => {
  const { node } = props
  return {
    marginLeft: withUnit(node.depth * 20 - 20, 'px')
  }
})

function toggleExpand() {
  props.node.expanded = !props.node.expanded
  getFlattedNodes()
  treeEmit('expand', props.node)
}

const handleClick = () => {
  const { node } = props
  treeEmit('node-click', node)

  treeProps.selectable && handleSelect(node)
  treeProps.expandOnClickNode && toggleExpand()
}
</script>
