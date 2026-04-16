<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled), bem.is('multiple', multiple), cls.m(size)]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    width="auto"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @update:visible="!$event && (qs = '')"
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
            :key="tag.value"
            :closable="!disabled"
            @close="handleCloseTag(tag)"
          >
            {{ tag.label }}
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
      <div v-if="filterable" :class="cls.e('panel-filter')">
        <u-input placeholder="输入关键字进行过滤" v-model="qs" :size="size" clearable>
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <div :class="cls.e('content')" v-if="panelItemList.length">
        <UCascadePanelItem
          v-for="({ nodes, key }, index) of panelItemList"
          :data="nodes"
          :key="key"
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

  <!-- 只读 -->
  <template v-else>
    <div :class="[cls.m(size)]" v-if="multiple">
      <div :class="cls.e('tags')">
        <u-tag v-for="tag of tags" :key="tag.value">
          {{ tag.label }}
        </u-tag>
      </div>
    </div>
    <template v-else>
      {{ displayedValue || FORM_EMPTY_CONTENT }}
    </template>
  </template>
</template>

<script lang="ts" setup>
import { useFormComponent, useFormFallbackProps, useUserOpration } from '@ui/compositions'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { CascadeProps, CascadeEmits, DropdownExposed } from '@ui/types'
import { bem } from '@ui/utils'
import { ArrowDown, Search, Close } from '@ultra/icon'
import { Forest, getChainValue } from 'cat-kit/fe'
import { computed, provide, shallowRef, triggerRef, watch } from 'vue'

import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UTag } from '../tag'
import UCascadePanelItem from './cascade-panel-item.vue'
import { CascadeDIKey } from './di'
import { CascadeNode } from './node'
import { useCheck } from './use-check'
import { useDataMap } from './use-data-map'
import { useSelect } from './use-select'

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

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const dropdownRef = shallowRef<DropdownExposed>()

const forest = computed(() => {
  return Forest.create(props.data ?? [], {
    createNode: (data, index) => {
      if (!data) {
        return new CascadeNode({
          data,
          index,
          value: '',
          label: ''
        })
      }

      return new CascadeNode({
        data,
        index,
        value: getChainValue(data, props.valueKey) ?? '',
        label: getChainValue(data, props.labelKey) ?? ''
      })
    },
    childrenKey: props.childrenKey
  })
})

const { dataMap } = useDataMap({ props, forest })

// 初始化更新辅助
const { isUserOprating, markAsUserOpration } = useUserOpration()

const {
  displayedValue,
  selectItem,
  updateSingleValue,
  panelItemList,
  getPanelItemList,
  createPanelItem,
  selectedNodeKeys
} = useSelect({
  props,
  emit,
  dataMap,
  forest,
  isUserOprating,
  dropdownRef
})

const { hovered, tags, restTag, updateMultipleValue, handleCloseTag, checkItem, checkedSet } =
  useCheck({
    props,
    forest,
    getPanelItemList,
    emit,
    dataMap,
    isUserOprating,
    disabled,
    readonly
  })

const handleClick = markAsUserOpration((panelIndex: number, item: CascadeNode) => {
  // 选择
  selectItem(panelIndex, item)

  if (props.multiple) return

  // 更新数据
  if (!props.strict) {
    updateSingleValue()
  } else if (!item.children?.length) {
    updateSingleValue()
  }
})

const handleCheck = markAsUserOpration((item: CascadeNode, checked: boolean) => {
  checkItem(item, checked)
})

const handleClear = markAsUserOpration(() => {
  if (props.multiple) {
    checkedSet.value.clear()
    triggerRef(checkedSet)
    updateMultipleValue()
  } else {
    selectedNodeKeys.value = []
    updateSingleValue()
  }

  getPanelItemList(forest.value.nodes)

  emit('clear')
})

// 过滤
const qs = shallowRef<string>('')

watch([qs, forest], ([qs, forest]) => {
  const { filterable } = props
  if (!filterable || !qs) {
    forest.dft((node) => (node.visible = true))
    getPanelItemList(forest.nodes)
    return
  }

  const cache = new Set<CascadeNode>()

  forest.dft((node) => {
    if (node.label?.toLowerCase().includes(qs.toLowerCase())) {
      node.visible = true
      let parent = node.parent
      while (parent && parent.depth !== 0 && !cache.has(parent)) {
        parent.visible = true
        cache.add(parent)
        parent = parent.parent
      }
    } else {
      node.visible = false
    }
  })

  panelItemList.value = [createPanelItem(forest.nodes)]
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
