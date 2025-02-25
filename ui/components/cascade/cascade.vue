<template>
  <u-dropdown
    v-if="!readonly"
    :class="[
      cls.b,
      bem.is('disabled', disabled),
      bem.is('multiple', multiple),
      cls.m(size)
    ]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    width="auto"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <template #trigger>
      <!-- 单选展示 -->
      <u-input
        v-if="!multiple"
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        native-readonly
        :model-value="displayedValue"
        @clear="handleClear"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>

      <!-- 多选展示 -->
      <template v-if="multiple">
        <span :class="cls.e('placeholder')" v-show="!modelValue?.length">
          {{ placeholder }}
        </span>

        <div v-if="modelValue?.length" :class="cls.e('tags')">
          <u-tag
            v-for="tag of tags"
            :key="tag[valueKey]"
            :closable="!disabled"
            @close="handleCloseTag(tag)"
          >
            {{ getChainValue(tag, labelKey!) }}
          </u-tag>
          <u-tag v-if="restTag"> {{ restTag }}+ </u-tag>
        </div>

        <transition name="zoom-in" mode="out-in">
          <u-icon
            v-if="clearable && modelValue?.length && hovered && !disabled"
            :class="cls.e('clear')"
            @click.stop="handleClear"
          >
            <Close />
          </u-icon>

          <u-icon :class="cls.e('arrow')" v-else><ArrowDown /></u-icon>
        </transition>
      </template>
    </template>

    <template #content>
      <!-- 过滤 -->
      <div v-if="filterable" :class="[cls.e('panel-filter'), cls.m(size)]">
        <u-input
          placeholder="输入关键字进行过滤"
          v-model="qs"
          :size="size"
          clearable
        >
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <div :class="cls.e('content')" v-if="panelItemList.length">
        <UCascadePanelItem
          v-for="(panelItem, index) of panelItemList"
          :data="panelItem.items"
          :key="panelItem.key"
          :panel-index="index"
          :value="selectedNodeKeys[index]"
          @click="handleClick"
          @check="handleCheck"
        />
      </div>

      <div :class="cls.e('empty')" v-else>
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <!-- <div :class="[cls.m(size)]">
    <div :class="cls.e('tags')">
      <u-tag> </u-tag>
    </div>
  </div> -->

  <!-- <span v-else>{{ FORM_EMPTY_CONTENT }}</span> -->
</template>

<script lang="ts" setup generic="Multiple extends boolean">
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock
} from '@ui/compositions'
import type { CascadeProps, CascadeEmits, DropdownExposed } from '@ui/types'
import { bem } from '@ui/utils'
import { provide, shallowRef, triggerRef, watch, watchEffect } from 'vue'
import { ArrowDown, Search, Close } from 'icon-ultra'
import { CascadeDIKey } from './di'
import { UInput } from '../input'
import { UTag } from '../tag'
import { UIcon } from '../icon'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import UCascadePanelItem from './cascade-panel-item.vue'
import { getChainValue } from 'cat-kit/fe'
import { useDataMap } from './use-data-map'
import { useSelect } from './use-select'
import { useCheck } from './use-check'

defineOptions({
  name: 'Cascade'
})

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  separator: '/',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: 'children',
  filterable: false,
  data: () => [],
  visibilityLimit: 3
})

const emit = defineEmits<CascadeEmits>()

const cls = bem('cascade')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  { size: 'default', disabled: false, readonly: false }
)

const dropdownRef = shallowRef<DropdownExposed>()

const { dataMap } = useDataMap(props)

const {
  displayedValue,
  selectItem,
  updateSingleValue,
  panelItemList,
  initSingleSelect,
  createPanelItem,
  selectedNodeKeys
} = useSelect({
  props,
  emit,
  dataMap,
  dropdownRef
})

const {
  hovered,
  tags,
  restTag,
  updateMultipleValue,
  handleCloseTag,
  checkItem,
  checkedSet
} = useCheck({
  props,
  emit,
  dataMap,
  disabled,
  readonly
})

// 调度
const [update, lock] = useUpdateLock()

function initMultipleCheck() {
  const { modelValue, data } = props
  panelItemList.value = [createPanelItem(data)]
  if (Array.isArray(modelValue)) {
    checkedSet.value = new Set(modelValue.map(v => dataMap.value.get(v)!))
  }
}

watchEffect(() => {
  const { multiple } = props
  if (!dataMap.value.size) return

  if (multiple) {
    update(() => initMultipleCheck())
  } else {
    update(() => initSingleSelect())
  }
})

function handleClick(panelIndex: number, item: Record<string, any>) {
  // 选择
  const children = selectItem(panelIndex, item)

  // 更新数据
  !props.multiple &&
    lock(() => {
      if (!props.checkStrictly) {
        updateSingleValue()
      } else if (!children?.length) {
        updateSingleValue()
      }
    })
}

function handleCheck(item: Record<string, any>, checked: boolean) {
  lock(() => checkItem(item, checked))
}

function handleClear() {
  if (props.multiple) {
    checkedSet.value.clear()
    triggerRef(checkedSet)
    updateMultipleValue()
  } else {
    selectedNodeKeys.value = []
    updateSingleValue()
  }

  emit('clear')
}

// 过滤
const qs = shallowRef<string>('')

watch(qs, qs => {
  const { data, filterable, labelKey, childrenKey } = props
  if (!filterable || !qs) {
    panelItemList.value = [createPanelItem(data)]
    return
  }

  // 用于存储匹配的节点路径
  const matchedPaths = new Map<string, Record<string, any>[]>()

  // 深度优先遍历,收集匹配的节点路径
  function dfs(node: Record<string, any>, path: Record<string, any>[]) {
    const label = getChainValue(node, labelKey!)
    const children = getChainValue(node, childrenKey!)
    const currentPath = [...path, node]

    // 当前节点匹配,记录完整路径
    if (label?.toLowerCase().includes(qs.toLowerCase())) {
      matchedPaths.set(label, currentPath)
    }

    // 递归遍历子节点
    if (children?.length) {
      for (const child of children) {
        dfs(child, currentPath)
      }
    }
  }

  // 遍历原始数据收集路径
  data?.forEach(node => dfs(node, []))

  // 根据收集的路径重建树结构
  function rebuildTree(paths: Record<string, any>[][]) {
    const result: Record<string, any>[] = []
    const nodeMap = new Map<string, Record<string, any>>()

    // 遍历所有路径
    for (const path of paths) {
      let current = result

      // 遍历单条路径的每个节点
      for (const node of path) {
        const value = getChainValue(node, labelKey!)
        let clonedNode = nodeMap.get(value)

        if (!clonedNode) {
          // 克隆节点,保留原始引用的属性
          clonedNode = { ...node }
          clonedNode[childrenKey!] = []
          nodeMap.set(value, clonedNode)
        }

        // 将节点添加到当前层级
        if (!current.includes(clonedNode)) {
          current.push(clonedNode)
        }

        current = clonedNode[childrenKey!]
      }
    }

    return result
  }

  panelItemList.value = [
    createPanelItem(rebuildTree(Array.from(matchedPaths.values())))
  ]
})

provide(CascadeDIKey, {
  cls,
  size,
  disabled,
  readonly,
  cascadeProps: props,
  checkedSet
})
</script>
