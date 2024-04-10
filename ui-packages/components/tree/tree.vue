<template>
  <div :class="cls.b">
    <UTreeNode v-for="node of treeData.nodes" :node="node" />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import type { TreeProps, TreeEmit } from '@ui/types/components/tree'
import { computed, provide, watchEffect } from 'vue'
import { TreeDIKey } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { CustomTreeNode } from './tree-node'

defineOptions({
  name: 'Tree'
})

const props = withDefaults(defineProps<TreeProps<DataItem>>(), {
  labelKey: 'label',
  valueKey: 'value',
  childrenKey: 'child',
  expanded: false,
  expandOnClickNode: false
})

const emit = defineEmits<TreeEmit>()

const cls = bem('tree')

const treeData = computed(() => {
  return Forest.create(props.data, CustomTreeNode)
})

watchEffect(() => {
  if (props.expandAll) {
    treeData.value.dft(node => {
      node.expanded = true
    })
  }
})

// const handleNodeClicked = (node: any) => {
//   node.value = node
//   // console.log(node, 'node')
// }

provide(TreeDIKey, {
  treeProps: props as TreeProps<Record<string, any>>,
  cls,
  treeEmit: emit
})
</script>
