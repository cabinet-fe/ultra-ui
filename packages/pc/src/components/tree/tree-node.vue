<template>
  <div
    :class="[
      cls.e('node'),
      bem.is('expanded', node.expanded),
      bem.is('disabled', node.disabled)
    ]"
    :style="{
      paddingLeft: withUnit(node.depth * 20 - 20, 'px')
    }"
    :ref="measureElement"
  >
    <u-icon
      v-if="!node.isLeaf"
      :class="cls.e('expand-icon')"
      @click.stop="toggleExpand"
    >
      <ArrowRight />
    </u-icon>
    <i v-else :class="cls.e('icon-placeholder')"> </i>

    <div
      :class="cls.e('node-content')"
      @click="handleClick"
      @contextmenu="treeEmit('node-contextmenu', $event, node)"
      v-ripple="
        (treeProps.checkable || treeProps.selectable) && !node.disabled
          ? cls.e('ripple')
          : false
      "
    >
      <u-checkbox
        v-if="treeProps.checkable"
        :class="cls.e('checkbox')"
        :model-value="node.checked"
        :indeterminate="node.indeterminate"
        :disabled="node.disabled"
        @change="handleChange"
        @click.stop
      />

      <u-node-render :content="getTreeSlotsNode({ node, data: node.data })" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TreeDIKey } from './di'
import { inject } from 'vue'
import { bem, withUnit } from '@ultra-ui/core'
import { UIcon } from '../icon'
import { ArrowRight } from '@lucide/vue'
import type { TreeNodeProps } from '@ultra-ui/pc/types'
import UCheckbox from '../checkbox/checkbox.vue'
import { UNodeRender } from '../node-render'
import { vRipple } from '@ultra-ui/directives'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<TreeNodeProps>()

const {
  treeProps,
  treeEmit,
  cls,
  getTreeSlotsNode,
  getFlattedNodes,
  toggleCheck,
  handleSelect
} = inject(TreeDIKey)!

function toggleExpand() {
  const { node } = props
  node.expanded = !node.expanded
  getFlattedNodes()

  treeEmit('expand', node)
}

function handleChange(checked: boolean, e: MouseEvent) {
  toggleCheck(props.node, checked, e.ctrlKey)
}

function handleClick(e: MouseEvent) {
  const { node } = props
  treeEmit('node-click', node)

  treeProps.selectable && handleSelect(node)
  treeProps.expandOnClickNode && toggleExpand()
  treeProps.checkable &&
    !node.disabled &&
    !treeProps.expandOnClickNode &&
    toggleCheck(node, !node.checked, e.ctrlKey)
}
</script>
