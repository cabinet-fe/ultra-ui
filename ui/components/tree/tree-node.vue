<template>
  <div
    :class="[
      cls.e('node'),
      bem.is('expanded', node.expanded),
      bem.is('disabled', node.disabled)
    ]"
    :style="{
      marginLeft: withUnit(node.depth * 20 - 20, 'px')
    }"
    @click="handleClick"
    @contextmenu="treeEmit('node-contextmenu', $event, node)"
  >
    <u-icon
      v-if="!node.isLeaf"
      :class="cls.e('expand-icon')"
      @click.stop="toggleExpand"
    >
      <ArrowRight />
    </u-icon>
    <i v-else :class="cls.e('icon-placeholder')" />

    <span
      :class="cls.e('node-content')"
      v-ripple="
        (treeProps.checkable || treeProps.selectable) && !node.disabled
          ? cls.e('ripple')
          : false
      "
    >
      <u-checkbox
        v-if="treeProps.checkable"
        :model-value="node.checked"
        :indeterminate="node.indeterminate"
        @update:model-value="handleCheck(node, $event)"
        :disabled="node.disabled"
        @click.stop
      />
      <u-node-render :content="getTreeSlotsNode({ node, data: node.value })" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { TreeDIKey } from './di'
import { inject } from 'vue'
import { bem, withUnit } from '@ui/utils'
import { UIcon } from '../icon'
import { ArrowRight } from 'icon-ultra'
import type { TreeNodeProps } from '@ui/types/components/tree'
import UCheckbox from '../checkbox/checkbox.vue'
import { UNodeRender } from '../node-render'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'TreeNode'
})

const { node } = defineProps<TreeNodeProps>()

const {
  treeProps,
  treeEmit,
  cls,
  getTreeSlotsNode,
  getFlattedNodes,
  handleCheck,
  handleSelect
} = inject(TreeDIKey)!

function toggleExpand() {
  node.expanded = !node.expanded
  getFlattedNodes()
  treeEmit('expand', node)
}

const handleClick = () => {
  treeEmit('node-click', node)

  treeProps.selectable && handleSelect(node)
  treeProps.expandOnClickNode && toggleExpand()
  treeProps.checkable &&
    !node.disabled &&
    !treeProps.expandOnClickNode &&
    handleCheck(node, !node.checked)
}
</script>
