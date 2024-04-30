<template>
  <div :class="nodeClass" :style="style" @click="handleClick">
    <u-icon
      v-if="!node.isLeaf"
      :class="expandClass"
      @click.stop="toggleExpand"
    >
      <ArrowRight />
    </u-icon>

    <i v-else style="display: inline-block; width: 24px; height: 20px" />

    <u-checkbox
      v-if="treeProps.checkable"
      :model-value="checked.has(node.value[treeProps.valueKey!])"
      :indeterminate="node.indeterminate"
      @update:model-value="handleCheck($event)"
    />

    <u-node-render
      :content="getTreeSlotsNode({ node: node, data: node.value })"
    />
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
import { Tree } from 'cat-kit/fe'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<TreeNodeProps>()

const { treeProps, treeEmit, cls, selected, checked, getTreeSlotsNode, getFlattedNodes } =
  inject(TreeDIKey)!

/** 行class */
const nodeClass = computed(() => {
  const { node } = props
  return [cls.e('node'), bem.is('active', node === selected.value)]
})

const style = computed(() => {
  const { node } = props
  return {
    marginLeft: withUnit(node.depth * 20 - 20, 'px')
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

    node.indeterminate = false

    if (!checkStrictly) {
      let parent = node.parent
      while (parent && parent.depth > 0) {
        parent.checked = parent.children!.every(child => child.checked)
        if (!parent.checked) {
          parent.indeterminate = true
        } else {
          parent.indeterminate = false
          checked.add(parent.value[valueKey!])
        }

        parent = parent.parent
      }
    }
  } else {
    Tree.dft(node, node => {
      node.checked = false
      checked.delete(node.value[valueKey!])
    })

    if (!checkStrictly) {
      let parent = node.parent
      while (parent && parent.depth > 0) {
        parent.checked = false
        checked.delete(parent.value[valueKey!])

        parent.indeterminate =
          (parent.children!.some(child => child.checked) &&
            parent.children!.some(child => !child.checked)) ||
          parent.children!.some(child => child.indeterminate)

        parent = parent.parent
      }
    }
  }

  treeEmit('check', _checked, node.value, checked)
}


function toggleExpand() {
  props.node.expanded = !props.node.expanded
  getFlattedNodes()
  treeEmit('expand', props.node)
}

const handleClick = () => {
  const { node } = props

  if (treeProps.expandOnClickNode) {
    toggleExpand()
  } else {
    if (!treeProps.selectable) return

    selected.value = node
    treeEmit('node-click', node)
  }
}
</script>
