<template>
  <div :class="[cls.b, cls.m(size)]">
    <UTreeNode v-for="node of nodes" :node="node" />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import type {
  TreeProps,
  TreeEmit,
  TreeExposed
} from '@ui/types/components/tree'
import {
  computed,
  provide,
  reactive,
  shallowRef,
  useSlots,
  watch,
  watchEffect,
  type VNode
} from 'vue'
import { TreeDIKey, type TreeSlotsScope } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { TreeNode } from './tree-node'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Tree'
})

const props = withDefaults(defineProps<TreeProps<DataItem>>(), {
  labelKey: 'label',
  valueKey: 'value',
  childrenKey: 'children',
  expandOnClickNode: false,
  checkStrictly: false,
  data: () => []
})

const emit = defineEmits<TreeEmit>()

const cls = bem('tree')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

defineSlots<{
  default: (props: TreeSlotsScope<DataItem>) => any
}>()

const slots = useSlots()

const getTreeSlotsNode = (ctx: TreeSlotsScope): VNode[] | undefined => {
  return slots.default?.(ctx) ?? ctx.data[props.labelKey]
}

/** 森林 */
const forest = computed(() => {
  return Forest.create(props.data, TreeNode)
})
/** 默认选中 */
watchEffect(() => {
  props.expandAll &&
    forest.value.dft(node => {
      node.expanded = true
    })
})

const nodes = shallowRef<TreeNode<DataItem>[]>([])

function getFlattedNodes(filter?: (node: TreeNode<DataItem>) => boolean) {
  const _nodes: TreeNode<DataItem>[] = []
  if (filter) {
    forest.value.dft(node => {
      if ((node.parent?.expanded || node.depth === 1) && filter(node)) {
        _nodes.push(node)
      }
    })
  } else {
    forest.value.dft(node => {
      if (node.parent?.expanded || node.depth === 1) {
        _nodes.push(node)
      }
    })
  }

  nodes.value = _nodes
}
getFlattedNodes()
watch(forest, () => {
  getFlattedNodes()
})

function filter(filter: (node: TreeNode<DataItem>) => boolean) {
  getFlattedNodes(filter)
}

const checked = reactive<Set<string | number>>(new Set())
const selected = shallowRef<TreeNode<DataItem>>()

/** 父子节点的所有状态 */
const context = {
  treeProps: props as TreeProps<Record<string, any>>,
  treeEmit: emit,
  cls,
  selected,
  checked,
  getTreeSlotsNode,
  getFlattedNodes
}

provide(TreeDIKey, context)

defineExpose<TreeExposed<DataItem>>({
  filter
})
</script>
