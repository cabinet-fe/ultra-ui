<template>
  <div :class="cls.b">
    <!-- {{ store.nodes }} -->
    <UTreeNode
      v-for="node of treeData.nodes"
      :node="node"
      @node-click="handleNodeClick"
    />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import type { TreeProps, TreeEmit } from '@ui/types/components/tree'
import {
  computed,
  provide,
  shallowReactive,
  shallowRef,
  watch,
  watchEffect
} from 'vue'
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

const handleNodeClick = (_: DataItem, node: CustomTreeNode<DataItem>) => {
  store.currentNodes.value = node
}

/** 父子节点的所有状态 */
let store = shallowReactive({
  treeProps: props as TreeProps<Record<string, any>>,
  cls,
  treeEmit: emit,
  currentNodes: shallowRef({})
})

provide(TreeDIKey, store)

watch(
  () => store.currentNodes.value,
  (value: any) => {
    if (props.select) {
      treeData.value.dft(node => {
        if (node.value.id === value.value.id) {
          node.active = true
        } else {
          node.active = false
        }
      })
    }
  }
)
</script>
