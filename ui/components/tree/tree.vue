<template>
  <div :class="className">
    <UTreeNode
      v-for="(node, index) of nodes"
      :node="node"
      :key="node.value[valueKey] ?? index"
      :class="bem.is('selected', node.value === selected)"
    />
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
  shallowRef,
  useSlots,
  watch,
  watchEffect,
  type VNode
} from 'vue'
import { TreeDIKey, type TreeConText, type TreeSlotsScope } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { TreeNode } from './tree-node'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useSelect } from './use-select'
import { useCheck } from './use-check'

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

const emit = defineEmits<TreeEmit<DataItem>>()

const cls = bem('tree')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('selectable', props.selectable),
    bem.is('checkable', props.checkable)
  ]
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
  return Forest.create(props.data, TreeNode, {
    onNodeCreated(node) {
      node.disabled = props.disabledNode?.(node.value, node) ?? false
    }
  })
})
/** 默认选中 */
watchEffect(() => {
  props.expandAll &&
    forest.value.dft(node => {
      node.expanded = true
    })
})

const nodes = shallowRef<TreeNode<DataItem>[]>([])

/**
 * 数据的字典，key为指定的valueKey的值
 */
const dataDicts = computed(() => {
  const { valueKey } = props
  return new Map(nodes.value.map(({ value }) => [value[valueKey], value]))
})

/** 获取碾平后的节点 */
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
        return true
      }
      return false
    })
  }

  nodes.value = _nodes
}

watch(
  forest,
  () => {
    getFlattedNodes()
  },
  {
    immediate: true
  }
)

function filter(filter: (node: TreeNode<DataItem>) => boolean) {
  getFlattedNodes(filter)
}

const { handleSelect, selected } = useSelect<DataItem>({
  props,
  emit,
  dataDicts
})

const { checked, handleCheck } = useCheck<DataItem>({
  props,
  emit,
  dataDicts
})

provide(TreeDIKey, {
  cls,
  selected,
  checked,
  getFlattedNodes,
  getTreeSlotsNode,
  treeEmit: emit as TreeEmit,
  treeProps: props as TreeProps,
  handleCheck: handleCheck as TreeConText['handleCheck'],
  handleSelect: handleSelect as TreeConText['handleSelect']
})

defineExpose<TreeExposed<DataItem>>({
  filter
})
</script>
