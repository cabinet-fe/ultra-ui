<template>
  <u-scroll
    :class="className"
    ref="scrollRef"
    :content-class="[cls.e('wrap'), bem.is('virtual', virtualEnabled)]"
  >
    <template v-if="virtualEnabled">
      <UTreeNode
        v-for="{ node, key, offset, index } of virtualNodes"
        :node="node"
        :key="key"
        :class="bem.is('selected', node.data === selectedData)"
        :index="index"
        :measure-element="measureElement"
        :style="{ transform: `translateY(${offset}px)` }"
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
import { useFormFallbackProps, useVirtualizer } from '@veltra/compositions'
import { bem, nextFrame, scrollIntoContainerView } from '@veltra/utils'
import { computed, provide, shallowRef, useSlots, watch, watchEffect, type VNode } from 'vue'

import type { TreeProps, TreeEmit, _TreeExposed } from '../../types'
import type { ScrollExposed } from '../../types'
import { injectFormContext } from '../../utils/form-context'
import { UEmpty } from '../empty'
import { UScroll } from '../scroll'
import { TreeDIKey, type TreeConText, type TreeSlotsScope } from './di'
import UTreeNode from './tree-node.vue'
import { useCheck } from './use-check'
import { useFilter } from './use-filter'
import { useSelect } from './use-select'
import { useTreeNodes } from './use-tree-nodes'

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

const { formProps } = injectFormContext()

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

const estimateSize = (): number => {
  // 基于 style.scss 中节点稳态高度推算的默认值；
  // 实际高度仍由 `measureElement` 通过 ResizeObserver 回填覆盖。
  switch (size.value) {
    case 'small':
      return 32
    case 'large':
      return 44
    default:
      return 36
  }
}

// 80 阈值内化为消费者侧语义；低于此值时不启用虚拟化。
const virtualEnabled = computed(() => nodes.value.length > 80)

const { virtualizer, items } = useVirtualizer({
  count: computed(() => nodes.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  // 仅在虚拟化启用时把内容容器的 height 撑开到 totalSize；
  // 关闭时传 null，hook 会清除此前写入的内联 height，回到 CSS 默认。
  contentEl: () => (virtualEnabled.value ? (scrollRef.value?.contentRef ?? null) : null),
  estimateSize,
  gap: 2,
  // 以节点稳定 key 作为虚拟项身份，展开 / 收起 / 过滤引起的 nodes 数组变更
  // 保留未移动节点的真实测量值，避免再次滚动首屏抖动。
  getItemKey: (i) => nodes.value[i]?.key ?? i
})

// 身份稳定性已由底层 `getItemKey` 保证；直接以 `node.key` 作为 Vue 层 key。
// `item.index` 仅作为 nodes / snapshot 竞态边缘的 fallback。
const virtualNodes = computed(() => {
  const _nodes = nodes.value
  return items.value.map((item) => {
    const node = _nodes[item.index]!
    return {
      node,
      key: node?.key ?? item.index,
      offset: item.start,
      index: item.index
    }
  })
})

const measureElement: (index: number, el: Element | null) => void = (index, el) =>
  virtualizer.measureElement(index, el)

function scrollTo(index: number): void {
  virtualizer.scrollToIndex(index, { align: 'center' })
}

function scrollIntoView() {
  const { selectable, checkable, scrollToView } = props
  if (!scrollToView || (!selectable && !checkable) || !nodes.value) return
  let index = -1

  if (selectable) {
    if (!selectedData.value) return
    index = nodes.value.findIndex((node) => node.data === selectedData.value)
  } else if (checkable) {
    if (!checkedData.size) return
    index = nodes.value.findIndex((node) => checkedData.has(node.data))
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
    forest.value.roots.forEach((node) => {
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
    forest.value.dfs((node) => {
      node.expanded = true
    })
    getFlattedNodes()
  },
  collapseAll() {
    forest.value.dfs((node) => {
      node.expanded = false
    })
    getFlattedNodes()
  }
})
</script>
