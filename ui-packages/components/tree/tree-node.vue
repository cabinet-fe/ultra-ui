<template>
  <div :class="nodeClass" :style="style" @click="handleClick">
    <u-icon
      v-if="!node.isLeaf"
      :class="expandClass"
      @click.stop="node.expanded = !node.expanded"
    >
      <ArrowRight />
    </u-icon>

    <!-- //TODO: 用类来替代style -->
    <i v-else style="display: inline-block; width: 24px; height: 20px" />

    <u-checkbox
      v-if="treeProps.checkable"
      :model-value="node.checked"
      @update:model-value="handleCheck($event)"
    />

    <u-node-render
      :content="getTreeSlotsNode({ node: node, data: node.value })"
    />
  </div>

  <template v-if="node.children && node.expanded">
    <UTreeNode v-for="child of node.children" :node="child" />
  </template>
</template>

<script lang="ts" setup>
import { TreeDIKey } from './di'
import { computed, inject } from 'vue'
import { bem, withUnit } from '@ui/utils'
import UTreeNode from './tree-node.vue'
import { UIcon } from '../icon'
import { ArrowRight } from 'icon-ultra'
import type { TreeNodeProps } from '@ui/types/components/tree'
import UCheckbox from '../checkbox/checkbox.vue'
import { Tree } from 'cat-kit/fe'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<TreeNodeProps>()

const { treeProps, treeEmit, cls, selected, checked, getTreeSlotsNode } =
  inject(TreeDIKey)!

/** 行class */
const nodeClass = computed(() => {
  const { node } = props
  return [cls.e('node'), bem.is('active', node === selected.value)]
})

const style = computed(() => {
  const { node } = props
  return {
    paddingLeft: withUnit(node.depth * 20 - 20, 'px')
  }
})

const expandClass = computed(() => {
  const { node } = props
  return [cls.e('expand-icon'), bem.is('expanded', node.expanded)]
})

/** 多选选中 */
const handleCheck = (_checked: boolean) => {
  const { valueKey, checkStrictly } = treeProps
  const { node } = props

  if (_checked) {
    Tree.dft(node, node => {
      node.checked = true
      checked.add(node.value[valueKey!])
    })
  } else {
    Tree.dft(node, node => {
      node.checked = false
      checked.delete(node.value[valueKey!])
    })

    // TODO为tree提供回溯API
  }

  // 没被选中 并且 子级全部为true 子级被选中 才出现indeterminate
  treeEmit('check', _checked, node.value, checked)
}

const handleClick = () => {
  const { node } = props
  if (treeProps.expandOnClickNode) {
    node.expanded = !node.expanded
    treeEmit('expand', node)
  } else {
    if (!treeProps.selectable) return

    selected.value = node

    treeEmit('node-click', node)
  }
}
</script>
