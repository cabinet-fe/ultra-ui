<template>
  <div :class="cls.b">
    <UTreeNode v-for="node of tree.nodes" :node="node" />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import type { TreeProps } from '@ui/types/components/tree'
import { computed, provide } from 'vue'
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
  childrenKey: 'child'
})

const cls = bem('tree')

const tree = computed(() => {
  return Forest.create(props.data, CustomTreeNode)
})

provide(TreeDIKey, {
  treeProps: props as TreeProps<Record<string, any>>,
  cls
})
</script>
