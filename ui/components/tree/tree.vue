<template>
  <u-scroll
    :class="className"
    ref="scrollRef"
    :content-style="{
      height: withUnit(totalHeight, 'px'),
      paddingTop: withUnit(virtualList[0]?.start, 'px')
    }"
  >
    <UTreeNode
      v-for="item of virtualList"
      :node="nodes[item.index]!"
      :key="item.key"
      :class="bem.is('selected', nodes[item.index]!.data === selected)"
    />

    <div :class="cls.e('empty')" v-if="!nodes.length">
      <UEmpty />
    </div>
  </u-scroll>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import { bem, withUnit } from '@ui/utils'
import type {
  TreeProps,
  TreeEmit,
  _TreeExposed
} from '@ui/types/components/tree'
import { computed, provide, shallowRef, useSlots, watch, type VNode } from 'vue'
import { TreeDIKey, type TreeConText, type TreeSlotsScope } from './di'
import UTreeNode from './tree-node.vue'
import { Forest } from 'cat-kit/fe'
import { TreeNode } from './tree-node'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useSelect } from './use-select'
import { useCheck } from './use-check'
import { UEmpty } from '../empty'
import { useVirtual } from '@ui/compositions'
import { UScroll, type ScrollExposed } from '../scroll'

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
  default: (props: TreeSlotsScope<DataItem>) => any
}>()

const slots = useSlots()

const getTreeSlotsNode = (
  ctx: TreeSlotsScope
): VNode[] | string | undefined => {
  return (props.slots?.default ?? slots.default)?.(ctx) ?? ctx.node.label
}

/** 森林 */
const forest = computed(() => {
  const { disabledNode } = props
  return Forest.create(props.data, {
    createNode: disabledNode
      ? (data, index) => {
          const node = new TreeNode({
            data,
            index,
            valueKey: props.valueKey,
            labelKey: props.labelKey
          })
          if (data) {
            node.disabled = disabledNode(data, node) ?? false
          }

          return node
        }
      : (data, index) => {
          const node = new TreeNode({
            data,
            index,
            valueKey: props.valueKey,
            labelKey: props.labelKey
          })
          return node
        }
  })
})

/** 默认选中 */
watch(
  [() => props.expandAll, forest],
  ([expandAll, forest]) => {
    expandAll &&
      forest.dft(node => {
        node.expanded = true
      })
  },
  { immediate: true }
)

const nodes = shallowRef<TreeNode<DataItem>[]>([])

/**
 * 节点的字典，key为指定的valueKey的值
 */
const nodeDict = computed(() => {
  const dict = new Map<string | number, TreeNode<DataItem>>()

  forest.value.dft(node => {
    dict.set(node.key, node)
  })

  return dict
})

/** 获取碾平后的节点 */
function getFlattedNodes() {
  const _nodes: TreeNode<DataItem>[] = []

  forest.value.dft(node => {
    if (!node.parentExpanded) return false
    node.visible && _nodes.push(node)
  })

  nodes.value = _nodes
}

watch(
  forest,
  () => {
    getFlattedNodes()
  },
  { immediate: true }
)

/**
 * 回溯缓存
 * @description
 * 在每一次过滤时，对每个节点的所有祖先节点进行堆入和展开，
 * 但这样的代价是巨大的，时间成本为O(nlog(n)). 因此使用一个回溯缓存来减少回溯的次数,
 * 该缓存堆入节点的父节点，如果该父节点已经被堆入则不再进行堆入
 */
const traceCache = new Set<TreeNode<DataItem>>()
const hiddenNodes = new Set<TreeNode<DataItem>>()

function defaultFilter(node: TreeNode<DataItem>, qs: string) {
  if (!qs) return true
  return node.label.includes(qs)
}

/**
 * 显示回溯
 * @param node 节点
 */
function trace(node: TreeNode<DataItem>) {
  node.visible = true
  let parent = node.parent

  while (parent && parent.depth !== 0 && !traceCache.has(parent)) {
    traceCache.add(parent)
    parent.expanded = true
    parent.visible = true
    parent = parent.parent
  }

  // 非叶子节点将自身堆入
  if (!node.isLeaf) {
    traceCache.add(node)
  }
}

function filter(
  filterMethod: string | ((node: TreeNode<DataItem>) => boolean)
) {
  traceCache.clear()

  if (typeof filterMethod === 'string') {
    forest.value.dft(node => {
      if (defaultFilter(node, filterMethod)) {
        trace(node)
      } else {
        node.visible = false
      }
    })
  } else {
    forest.value.dft(node => {
      if (filterMethod(node)) {
        trace(node)
      } else {
        node.visible = false
      }
    })
  }

  getFlattedNodes()
}

const { handleSelect, selected } = useSelect<DataItem>({
  props,
  emit,
  nodeDict
})

const { checked, handleCheck } = useCheck<DataItem>({
  props,
  emit,
  nodeDict
})

const { totalHeight, virtualList, scrollTo } = useVirtual({
  count: computed(() => nodes.value.length),
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null)
})

provide(TreeDIKey, {
  cls,
  selected,
  checked,
  getFlattedNodes,
  getTreeSlotsNode,
  hiddenNodes,
  treeEmit: emit as TreeEmit,
  treeProps: props as TreeProps,
  handleCheck: handleCheck as TreeConText['handleCheck'],
  handleSelect: handleSelect as TreeConText['handleSelect']
})

defineExpose<_TreeExposed<DataItem>>({
  filter,
  forest,
  nodes,
  checkNode: handleCheck,
  selectNode: handleSelect,
  checkAll(check: boolean) {
    forest.value.nodes.forEach(node => {
      handleCheck(node, check)
    })
  },
  getSelected(): DataItem | undefined {
    return selected.value
  },
  getChecked(): DataItem[] {
    return Array.from(checked)
  },
  scrollTo,
  scrollToSelected() {
    scrollTo(nodes.value.findIndex(node => node.data === selected.value))
  },
  scrollToChecked() {
    scrollTo(nodes.value.findLastIndex(node => checked.has(node.data)))
  }
})
</script>
