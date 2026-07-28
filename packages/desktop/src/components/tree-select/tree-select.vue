<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    :class="[cls.b, bem.is('disabled', disabled)]"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size), contentClass]"
    :content-style="contentStyle"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :min-width="minWidth"
    :width="width"
    :disabled="disabled"
    @update:visible="handleDropdownVisible"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <template #trigger>
      <u-input
        ref="inputRef"
        :size="size"
        :disabled="disabled"
        :placeholder="inputPlaceholder"
        :clearable="false"
        :model-value="inputValue"
        @update:model-value="handleQueryInput"
        :native-readonly="!filterable || !querying"
        @click.capture="handleTriggerClickCapture"
      >
        <template #prefix v-if="$slots.prefix">
          <slot name="prefix" />
        </template>
        <template #suffix>
          <transition name="zoom-in" mode="out-in">
            <u-icon
              v-if="showClear"
              :class="cls.e('clear')"
              title="清除"
              key="clear"
              @click.stop="handleClear"
            >
              <Close />
            </u-icon>
            <u-icon v-else :class="cls.e('arrow')" key="arrow"><ArrowDown /></u-icon>
          </transition>
        </template>
      </u-input>
    </template>
    <template #content>
      <!-- 菜单列表 -->

      <u-tree
        v-bind="treeProps"
        :selected="model"
        @update:selected="handleSelect"
        ref="treeRef"
        selectable
        :class="cls.e('content-tree')"
        :slots="slots"
        scroll-to-view
      />
    </template>
  </u-dropdown>

  <template v-else>
    {{ label || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { dfs, o } from '@cat-kit/core'
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { ArrowDown, Close } from '@veltra/icons/normal'
import { bem, fieldKey, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { TreeSelectProps, TreeSelectEmits, TreeExposed, InputExposed } from '../../types'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UTree } from '../tree'
import type { TreeSlotsScope } from '../tree/di'

defineOptions({ name: 'UTreeSelect', inheritAttrs: false })

const props = withDefaults(defineProps<TreeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: false,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false,
  minWidth: '280px'
})

const emit = defineEmits<TreeSelectEmits>()

const slots = defineSlots<{
  /** 默认插槽 */
  default?: (props: TreeSlotsScope) => any
  /** 前缀插槽 */
  prefix?: () => any
}>()

const treeProps = computed(() => {
  return o(props as Record<string, any>).omit([
    'tips',
    'field',
    'placeholder',
    'disabled',
    'label',
    'readonly',
    'contentClass',
    'contentStyle',
    'minWidth',
    'width'
  ])
})

const cls = bem('tree-select')

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

/**过滤 */
const qs = shallowRef('')
watch(qs, (qs) => {
  treeRef.value?.filter(qs)
})

const model = defineModel<string | number>()

/** 内部展示文案，仅由 data 推导；通过 update:text 单向通知父级 */
const label = shallowRef<string>()

const dropdownVisible = shallowRef(false)

/**
 * 是否处于查询态：决定触发输入框显示查询串还是选中标签。
 * 与面板可见状态解耦 —— 选择后立即退出查询态，
 * 不等面板关闭动画结束（否则显示值会延迟一个动画时长才恢复）。
 */
const querying = shallowRef(false)

const inputRef = useTemplateRef<InputExposed>('inputRef')

/** 更新内部文案；值变化时单向 emit update:text */
function setLabel(next?: string) {
  if (label.value === next) return
  label.value = next
  emit('update:text', next)
}

/** 触发输入框的值：查询态下承载查询串，否则展示选中标签 */
const inputValue = computed(() => {
  if (props.filterable && querying.value) return qs.value
  return model.value || model.value === 0 ? label.value : undefined
})

/** 查询态下已选标签降级为占位提示 */
const inputPlaceholder = computed(() => {
  const display = model.value || model.value === 0 ? label.value : undefined
  if (props.filterable && querying.value && display) {
    return display
  }
  return props.placeholder
})

function handleQueryInput(value: string) {
  if (!props.filterable) return
  qs.value = value
}

const hovered = shallowRef(false)

/** 悬停且存在选中值时展示清除按钮（替代下拉箭头） */
const showClear = computed(() => {
  if (!props.clearable || disabled.value || !hovered.value) return false
  return !!(model.value || model.value === 0 ? label.value : undefined)
})

/**
 * 过滤模式下拦截输入区域的点击：
 * 阻止 dropdown 的 trigger 开合切换，保持面板展开以不中断输入。
 * 非输入区域（箭头、留白）放行，维持原开合行为。
 */
function handleTriggerClickCapture(e: MouseEvent) {
  if (!props.filterable || disabled.value) return
  if (!(e.target instanceof HTMLInputElement)) return

  e.stopPropagation()
  if (!dropdownVisible.value) dropdownRef.value?.open()
}

watch(dropdownVisible, (visible) => {
  if (visible && props.filterable) {
    // 面板展开后进入查询态并聚焦输入框，可以立即输入查询
    querying.value = true
    nextTick(() => inputRef.value?.el?.focus())
  } else if (!visible) {
    querying.value = false
  }
})

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const treeRef = shallowRef<TreeExposed>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

const { userAction, isUserActive } = useUserAction()

/** 清空 */
const handleClear = userAction(() => {
  model.value = ''
  setLabel(undefined)
  emit('clear')
  emit('change', undefined)
})

/** 外部回显：按 data 查找 label（O(n)）；用户动作期内跳过 */
watch(
  [() => props.data, model],
  ([data, modelVal]) => {
    if (isUserActive()) return
    if (!data?.length || modelVal === undefined || modelVal === null || modelVal === '') {
      setLabel(undefined)
      return
    }

    let nextLabel: string | undefined
    const childrenKey = props.childrenKey ?? 'children'
    data.some((item) => {
      let founded = false
      dfs(
        item,
        (v) => {
          if (v[valueKey.value] === modelVal) {
            nextLabel = v[labelKey.value]
            founded = true
            return true
          }
        },
        childrenKey
      )

      return founded
    })
    setLabel(nextLabel)
  },
  { immediate: true }
)

/** 用户选择：O(1) 写入值与文案，跳过 data 回显查找 */
const handleSelect = userAction(
  (selected?: string | number, selectedData?: Record<string, any>) => {
    model.value = selected ?? ''

    if (selectedData) {
      setLabel(o(selectedData).get(labelKey.value))
    } else {
      setLabel(undefined)
    }

    emit('change', selectedData)
    // 立即退出查询态，输入框同步恢复显示选中标签
    querying.value = false
    qs.value = ''
    dropdownRef.value?.close()
  }
)
const handleDropdownVisible = (visible: boolean) => {
  if (!visible) {
    qs.value = ''
  }
}
</script>
