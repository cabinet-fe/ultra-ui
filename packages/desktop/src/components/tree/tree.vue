<template>
  <u-scroll
    :class="className"
    ref="scrollRef"
    :content-style="{
      height: virtualEnabled ? withUnit(totalHeight, 'px') : undefined
    }"
    :content-class="[cls.e('wrap'), bem.is('virtual', virtualEnabled)]"
  >
    <template v-if="virtualEnabled">
      <UTreeNode
        v-for="{ node, key, offset, index } of virtualNodes"
        :node="node"
        :key="key"
        :class="bem.is('selected', node.data === selectedData)"
        :data-index="index"
        :measure-element="measureElement"
        :style="{
          transform: `translateY(${offset}px)`
        }"
      />
    </template>
    <template v-else>
      <UTreeNode
        v-for="node of nodes"
        :node="node"
        :key="node.key"
        :class="bem.is('selected', node.data === selectedData)"
      />
    </template>

    <div :class="cls.e('empty')" v-if="!nodes.length">
      <UEmpty />
    </div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { bem, nextFrame, withUnit, scrollIntoContainerView } from '@ultra-ui/utils'
import type { TreeProps, TreeEmit, _TreeExposed } from '../../types'
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
import { useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import { useSelect } from './use-select'
import { useCheck } from './use-check'
import { UEmpty } from '../empty'
import { useVirtual } from '@ultra-ui/compositions'
import { UScroll } from '../scroll'
import type { ScrollExposed } from '../../types'
import { useTreeNodes } from './use-tree-nodes'
import { useFilter } from './use-filter'

defineOptions({
  name: 'Tree'
})

const props = withDefaults(defineProps<TreeProps>(), {
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

const scrollRef = shallowRef<ScrollExposed>()

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('selectable', props.selectable),
    bem.is('checkable', props.checkable)
  ]
})

defineSlots<{
  default: (props: TreeSlotsScope) => any
}>()

const slots = useSlots()

function getTreeSlotsNode(ctx: TreeSlotsScope): VNode[] | string | undefined {
  return (props.slots?.default ?? slots.default)?.(ctx) ?? ctx.node.label
}

const { nodes, forest, getFlattedNodes, nodeDict } = useTreeNodes({
  props
})

watch(
  [() => props.selectable, () => props.checkable, forest],
  ([s, c]) => {
    // 如果选择或勾选，则不更新节点
    if (s || c) return
    getFlattedNodes()
  },
  { immediate: true }
)

const { filter } = useFilter({ forest, getFlattedNodes })

const { handleSelect, selectedData } = useSelect({
  props,
  emit,
  nodeDict,
  getFlattedNodes
})

const { checkedData, toggleCheck } = useCheck({
  props,
  emit,
  nodeDict,
  getFlattedNodes
})

const { totalHeight, virtualList, scrollTo, virtualEnabled, measureElement } =
  useVirtual({
    count: computed(() => nodes.value.length),
    estimateSize: () => 40,
    gap: 2,
    virtualThreshold: 80,
    scrollEl: computed(() => scrollRef.value?.containerRef ?? null)
  })

const virtualNodes = computed(() => {
  const _nodes = nodes.value

  return virtualList.value.map(item => {
    const node = _nodes[item.index]!
    return {
      node,
      key: node.key || item.key,
      offset: item.start,
      index: item.index
    }
  })
})

function scrollIntoView() {
  const { selectable, checkable, scrollToView } = props
  if (!scrollToView || (!selectable && !checkable) || !nodes.value) return
  let index = -1

  if (selectable) {
    if (!selectedData.value) return
    index = nodes.value.findIndex(node => node.data === selectedData.value)
  } else if (checkable) {
    if (!checkedData.size) return
    index = nodes.value.findIndex(node => checkedData.has(node.data))
  }

  if (virtualEnabled.value) {
    scrollTo(index)
  } else {
    const { contentRef, containerRef } = scrollRef.value ?? {}
    const el = contentRef?.children[index]
    el && scrollIntoContainerView(el as HTMLElement, containerRef ?? null)
  }
}

watchEffect(() => {
  nextFrame(() => {
    scrollIntoView()
  })
})

provide(TreeDIKey, {
  cls,
  selectedData,
  checkedData,
  getFlattedNodes,
  getTreeSlotsNode,
  treeEmit: emit as TreeEmit,
  treeProps: props as TreeProps,
  toggleCheck: toggleCheck as TreeConText['toggleCheck'],
  handleSelect: handleSelect as TreeConText['handleSelect']
})

defineExpose<_TreeExposed>({
  filter,
  forest,
  nodes,
  checkNode: toggleCheck,
  selectNode: handleSelect,
  checkAll(check: boolean) {
    forest.value.roots.forEach(node => {
      toggleCheck(node, check)
    })
  },
  getSelected() {
    return selectedData
  },
  getChecked() {
    return Array.from(checkedData)
  },
  scrollTo,

  expandAll() {
    forest.value.dfs(node => {
      node.expanded = true
    })
    getFlattedNodes()
  },
  collapseAll() {
    forest.value.dfs(node => {
      node.expanded = false
    })
    getFlattedNodes()
  }
})
</script>
