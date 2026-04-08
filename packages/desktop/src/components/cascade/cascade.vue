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
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock
} from '@ultra-ui/compositions'
import type { CascadeProps, CascadeEmits, DropdownExposed } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'
import { computed, provide, shallowRef, triggerRef, watch } from 'vue'
import { ArrowDown, Close, Search } from '@ultra-ui/icons/normal'
import { CascadeDIKey } from './di'
import { UInput } from '../input'
import { UTag } from '../tag'
import { UIcon } from '../icon'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ultra-ui/utils'
import UCascadePanelItem from './cascade-panel-item.vue'
import { Forest } from '@cat-kit/core'
import { getChainValue } from '@ultra-ui/utils'
import { useDataMap } from './use-data-map'
import { useSelect } from './use-select'
import { useCheck } from './use-check'
import { CascadeNode } from './node'

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

const forest = computed(() => {
  return new Forest<Record<string, unknown>, any>({
    data: (props.data ?? []) as Record<string, unknown>[],
    childrenKey: props.childrenKey,
    createNode: (data, index, depth, _forest, parent) => {
      if (!data) {
        return new CascadeNode({
          data,
          index,
          depth,
          value: '',
          label: '',
          parent
        })
      }

      return new CascadeNode({
        data,
        index,
        depth,
        value: getChainValue(data, props.valueKey) ?? '',
        label: getChainValue(data, props.labelKey) ?? '',
        parent
      })
    }
  })
})

const { dataMap } = useDataMap({ props, forest })

// 初始化更新辅助
const updater = useUpdateLock()

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
  updater,
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
  forest,
  getPanelItemList,
  emit,
  dataMap,
  updater,
  disabled,
  readonly
})

function handleClick(panelIndex: number, item: CascadeNode) {
  // 选择
  selectItem(panelIndex, item)

  // 更新数据
  !props.multiple &&
    updater.updateAndLock(() => {
      if (!props.strict) {
        updateSingleValue()
      } else if (!item.children?.length) {
        updateSingleValue()
      }
    })
}

function handleCheck(item: CascadeNode, checked: boolean) {
  updater.updateAndLock(() => checkItem(item, checked))
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

watch([qs, forest], ([qs, forest]) => {
  const { filterable } = props
  if (!filterable || !qs) {
    forest.dfs(node => (node.visible = true))
    getPanelItemList(forest.roots)
    return
  }

  const cache = new Set<CascadeNode>()

  forest.dfs(node => {
    if (node.label?.toLowerCase().includes(qs.toLowerCase())) {
      node.visible = true
      let parent = node.parent
      while (parent && !cache.has(parent)) {
        parent.visible = true
        cache.add(parent)
        parent = parent.parent
      }
    } else {
      node.visible = false
    }
  })

  panelItemList.value = [createPanelItem(forest.roots)]
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
