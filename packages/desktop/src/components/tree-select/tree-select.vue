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
    {{ text || label || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { dfs, o } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
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

const label = shallowRef<string>()

const dropdownVisible = shallowRef(false)

/**
 * 是否处于查询态：决定触发输入框显示查询串还是选中标签。
 * 与面板可见状态解耦 —— 选择后立即退出查询态，
 * 不等面板关闭动画结束（否则显示值会延迟一个动画时长才恢复）。
 */
const querying = shallowRef(false)

const inputRef = useTemplateRef<InputExposed>('inputRef')

/** 触发输入框的值：查询态下承载查询串，否则展示选中标签 */
const inputValue = computed(() => {
  if (props.filterable && querying.value) return qs.value
  return props.text ?? (model.value ? label.value : undefined)
})

/** 查询态下已选标签降级为占位提示 */
const inputPlaceholder = computed(() => {
  const display = props.text ?? (model.value ? label.value : undefined)
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
  return !!(props.text ?? (model.value ? label.value : undefined))
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

/**清空 */
const handleClear = () => {
  model.value = ''
  label.value = undefined
  emit('clear')
  emit('change', undefined)
  emit('update:text', '')
}

let changedByEvent = false
watch(
  [() => props.data, model],
  ([data, model]) => {
    if (changedByEvent) return
    if (!data?.length || model === undefined) {
      label.value = undefined
      model = undefined
      return
    }

    let founded = false
    const childrenKey = props.childrenKey ?? 'children'
    data.some((item) => {
      dfs(
        item,
        (v) => {
          if (v[valueKey.value] === model) {
            label.value = v[labelKey.value]
            founded = true
            return true
          }
        },
        childrenKey
      )

      return founded
    })
  },
  { immediate: true }
)

const handleSelect = (selected?: string | number, selectedData?: Record<string, any>) => {
  changedByEvent = true
  nextTick(() => {
    changedByEvent = false
  })

  model.value = selected ?? ''

  if (selectedData) {
    label.value = o(selectedData).get(labelKey.value)
  } else {
    label.value = ''
  }

  emit('change', selectedData)
  emit('update:text', label.value)
  // 立即退出查询态，输入框同步恢复显示选中标签
  querying.value = false
  qs.value = ''
  dropdownRef.value?.close()
}

const handleDropdownVisible = (visible: boolean) => {
  if (!visible) {
    qs.value = ''
  }
}
</script>
