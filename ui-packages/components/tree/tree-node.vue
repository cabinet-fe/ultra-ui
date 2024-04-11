<template>
  <div :class="nodeClass" :style="style" @click="toggleNodeExpand">
    <u-icon
      v-if="!node.isLeaf"
      :class="expandClass"
      @click.stop="node.expanded = !node.expanded"
    >
      <CaretRight />
    </u-icon>

    <i v-else style="display: inline-block; width: 14px; height: 14px" />

    <u-checkbox
      v-if="treeProps.checkable"
      v-model="a"
      @update:model-value="(checked: boolean) => handleCheckMode(checked, node)"
    ></u-checkbox>

    {{ node.value[treeProps.labelKey!] }}
  </div>

  <template v-if="node.children && node.expanded">
    <UTreeNode
      v-for="child of node.children"
      :node="child"
      @node-click="handleNodeClick(child)"
    />
  </template>
</template>

<script lang="ts" setup generic="Val extends Record<string, any>">
import { CustomTreeNode } from './tree-node'
import { TreeDIKey } from './di'
import { computed, inject, ref } from 'vue'
import { bem, withUnit } from '@ui/utils'
import UTreeNode from './tree-node.vue'
import { UIcon } from '../icon'
import { CaretRight } from 'icon-ultra'
import type { TreeNodeEmit, TreeNodeProps } from '@ui/types/components/tree'
import UCheckbox from '../checkbox/checkbox.vue'

defineOptions({
  name: 'TreeNode'
})

const a = ref(false)

const props = defineProps<TreeNodeProps<Val>>()

let injected = inject(TreeDIKey)!
const { treeProps, treeEmit, cls } = injected

let emit = defineEmits<TreeNodeEmit<Val>>()

/** 行class */
const nodeClass = computed(() => {
  return [cls.e('node'), bem.is('active', props.node?.active)]
})

const style = computed(() => {
  return {
    paddingLeft: withUnit(props.node.depth * 20 - 20, 'px')
  }
})

const expandClass = computed(() => {
  return [cls.e('expand-icon'), bem.is('expanded', props.node.expanded)]
})

const handleCheckMode = (value: boolean, node: CustomTreeNode<Val>) => {
  node.checked = value
}

const handleNodeClick = (node: CustomTreeNode<Val>) => {
  if (!treeProps.select) return
  injected.selectNodes.value = node

  console.log(injected.selectNodes.value, 'injected.selectNodes.value')
}

const toggleNodeExpand = async () => {
  if (treeProps.expandOnClickNode) {
    props.node.expanded = !props.node.expanded
  }

  treeEmit('expand', props.node)
  treeEmit('node-click', props.node.value, props.node)
  emit('node-click', props.node.value, props.node)
}
</script>
