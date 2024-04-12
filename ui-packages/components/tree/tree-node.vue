<template>
  <div :class="nodeClass" :style="style" @click="handleClick">
    <u-icon
      v-if="!node.isLeaf"
      :class="expandClass"
      @click.stop="node.expanded = !node.expanded"
    >
      <CaretRight />
    </u-icon>

    <i v-else style="display: inline-block; width: 20px; height: 14px" />

    <u-checkbox
      v-if="treeProps.checkable"
      :model-value="node.checked || node.allChecked"
      :indeterminate="node.indeterminate"
      @update:modelValue="handleCheck($event)"
    ></u-checkbox>

    {{ node.value[treeProps.labelKey!] }}
  </div>

  <template v-if="node.children && node.expanded">
    <UTreeNode v-for="child of node.children" :node="child" />
  </template>
</template>

<script lang="ts" setup generic="Val extends Record<string, any>">
import { CustomTreeNode } from './tree-node'
import { TreeDIKey } from './di'
import { computed, inject, watch } from 'vue'
import { bem, withUnit } from '@ui/utils'
import UTreeNode from './tree-node.vue'
import { UIcon } from '../icon'
import { CaretRight } from 'icon-ultra'
import type { TreeNodeEmit, TreeNodeProps } from '@ui/types/components/tree'
import UCheckbox from '../checkbox/checkbox.vue'
import { Tree } from 'cat-kit/fe'

defineOptions({
  name: 'TreeNode'
})

const props = defineProps<TreeNodeProps<Val>>()

const { node } = props

let { treeProps, treeEmit, cls, selected, checked } = inject(TreeDIKey)!

const { valueKey } = treeProps

let emit = defineEmits<TreeNodeEmit<Val>>()

/** 行class */
const nodeClass = computed(() => {
  return [cls.e('node'), bem.is('active', node === selected.value)]
})

const style = computed(() => {
  return {
    paddingLeft: withUnit(node.depth * 20 - 20, 'px')
  }
})

const expandClass = computed(() => {
  return [cls.e('expand-icon'), bem.is('expanded', node.expanded)]
})

/** 多选选中 */
const handleCheck = (_checked: boolean) => {
  node.checked = _checked

  const val = node.value[valueKey!]

  if (_checked) {
    checked.add(val)
  } else {
    console.log(_checked, '_checked')
    checked.delete(val)
  }

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
  }

  // 没被选中 并且 子级全部为true 子级被选中 才出现indeterminate
  treeEmit('check', _checked, node.value, checked)
}

watch(
  () => node.allChecked,
  value => {
    if (value) {
      checked.add(node.value[valueKey!])
    } else {
      if (!node.checked) {
        checked.delete(node.value[valueKey!])
      }
    }
  }
)

const handleClick = () => {
  if (treeProps.expandOnClickNode) {
    node.expanded = !node.expanded
    treeEmit('expand', node)
  } else {
    if (!treeProps.selectable) return

    selected.value = node as CustomTreeNode<Val>

    treeEmit('node-click', node.value, node)
  }
}
</script>
