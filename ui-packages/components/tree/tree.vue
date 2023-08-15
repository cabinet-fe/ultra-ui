<template>
  <div :class="cls.b">
    <UTreeNode v-for="node of tree.children" :node="node" />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import { TreeProps } from './tree.type'
import { computed, provide, shallowReactive } from 'vue'
import { TreeDIKey } from './di'
import UTreeNode from './tree-node.vue'
import { Tree } from 'cat-kit/fe'
import { CustomTreeNode } from './tree-node'

defineOptions({
  name: 'UTree'
})

const props = withDefaults(defineProps<TreeProps<DataItem>>(), {
  labelKey: 'label',
  valueKey: 'value',
  childrenKey: 'children'
})

const cls = bem('tree')

const tree = computed(() => {
  const root = Tree.create(
    {
      [props.childrenKey]: props.data
    } as DataItem,
    (v, index, parent) => {
      return shallowReactive(new CustomTreeNode(v, index, parent))
    }
  )
  return root
})


provide(TreeDIKey, {
  // @ts-ignore
  treeProps: props,
  cls
})
</script>
