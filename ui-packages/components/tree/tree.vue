<template>
  <div :class="[cls.b, cls.m(size)]">
    <UTreeNode v-for="node of treeData.nodes" :node="node" />
  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem } from '@ui/utils'
import type { TreeProps, TreeEmit } from '@ui/types/components/tree'
import { computed, provide, reactive, shallowRef, watchEffect } from 'vue'
import { TreeDIKey } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { CustomTreeNode } from './tree-node'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Tree'
})

const props = withDefaults(defineProps<TreeProps<DataItem>>(), {
  labelKey: 'label',
  valueKey: 'value',
  childrenKey: 'children',
  expanded: false,
  expandOnClickNode: false
})

const emit = defineEmits<TreeEmit>()

const cls = bem('tree')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const treeData = computed(() => {
  return Forest.create(props.data, CustomTreeNode)
})

/** 是否默认展开 */
watchEffect(() => {
  if (props.expandAll) {
    treeData.value.dft(node => {
      node.expanded = true
    })
  }
})

const checked = reactive<Set<string | number>>(new Set())
const selected = shallowRef<CustomTreeNode<DataItem>>()

/** 父子节点的所有状态 */
const context = {
  treeProps: props as TreeProps<Record<string, any>>,
  treeEmit: emit,
  cls,
  selected,
  checked
}

provide(TreeDIKey, context)
</script>
