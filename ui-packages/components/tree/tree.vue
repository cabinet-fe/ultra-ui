<template>
  <div :class="[cls.b, cls.m(size)]">
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
  reactive,
  shallowRef,
  watch,
  watchEffect
} from 'vue'
import { TreeDIKey } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { CustomTreeNode } from './tree-node'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { processRecursiveArray } from './utils'

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

watchEffect(() => {
  if (props.expandAll) {
    treeData.value.dft(node => {
      node.expanded = true
    })
  }
})

/** 父子节点的所有状态 */
let store = {
  treeProps: props as TreeProps<Record<string, any>>,
  cls,
  treeEmit: emit,
  selectNodes: shallowRef<Record<string, any>>({}),
  checkedData: reactive(new Set<string | number>()),
  currentChecked: shallowRef()
}

provide(TreeDIKey, store)

/** 点击所有节点 */
const handleNodeClick = (_, node: CustomTreeNode<DataItem>) => {
  store.selectNodes.value = node
}

if (props.select) {
  /** 单选高亮 */
  watch(
    () => store.selectNodes.value.value,
    value => {
      // console.log(treeData.value, 'treeData.value')
      treeData.value.dft(node => {
        if (node.value[props.valueKey] === value[props.valueKey]!) {
          node.active = true
        } else {
          node.active = false
        }
      })
    }
  )
}

/** 全选 */
watch(
  () => store.checkedData.size,
  () => {
    let { node, checked } = store.currentChecked.value
    console.log(node, 'node')
    processRecursiveArray(
      node.value?.[props.childrenKey] ?? [],
      props.childrenKey,
      item => {
        if (checked) {
          // console.log(item, 'item')
          store.checkedData.add(item[props.valueKey])
        } else {
          store.checkedData.delete(item[props.valueKey])
        }
      }
    )
  }
)
</script>
