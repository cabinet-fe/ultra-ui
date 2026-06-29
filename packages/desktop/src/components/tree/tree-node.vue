<template>
  <div
    :class="[cls.e('node'), bem.is('expanded', node.expanded), bem.is('disabled', node.disabled)]"
    :ref="measureRef"
  >
    <span v-for="i in node.depth" :key="i" :class="cls.e('indent')" aria-hidden="true"></span>

    <u-icon v-if="!node.isLeaf" :class="cls.e('expand-icon')" @click.stop="toggleExpand">
      <ArrowRight />
    </u-icon>
    <u-icon v-else :class="cls.e('leaf-icon')" aria-hidden="true">
      <Dot />
    </u-icon>

    <div
      :class="cls.e('node-content')"
      @click="handleClick"
      @contextmenu="treeEmit('node-contextmenu', $event, node)"
      v-ripple="
        (treeProps.checkable || treeProps.selectable) && !node.disabled ? cls.e('ripple') : false
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
import { vRipple } from '@veltra/directives'
import { ArrowRight, Dot } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject } from 'vue'

import type { TreeNodeProps } from '../../types'
import UCheckbox from '../checkbox/checkbox.vue'
import { UIcon } from '../icon'
import { UNodeRender } from '../node-render'
import { TreeDIKey } from './di'

defineOptions({ name: 'UTreeNode' })

const props = defineProps<TreeNodeProps>()

const { treeProps, treeEmit, cls, getTreeSlotsNode, getFlattedNodes, toggleCheck, handleSelect } =
  inject(TreeDIKey)!

function measureRef(el: unknown) {
  if (typeof props.index !== 'number' || !props.measureElement) return
  props.measureElement(props.index, el as Element | null)
}

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
