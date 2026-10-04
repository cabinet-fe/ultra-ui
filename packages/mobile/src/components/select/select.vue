<template>
  <!-- 只读态：纯展示 -->
  <template v-if="readonly">{{ displayedValue || FORM_EMPTY_CONTENT }}</template>

  <div
    v-else
    v-bind="$attrs"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('active', sheetVisible)]"
    :aria-expanded="sheetVisible"
    aria-haspopup="dialog"
    role="combobox"
    @click="handleTriggerClick"
  >
    <span v-if="$slots.prefix" :class="cls.e('prefix')">
      <slot name="prefix" />
    </span>

    <span :class="[cls.e('value'), bem.is('placeholder', !displayedValue)]">
      {{ displayedValue || placeholder }}
    </span>

    <span :class="cls.e('icons')">
      <button
        v-if="showClear"
        :class="cls.e('clear')"
        type="button"
        aria-label="清除"
        @click.stop="handleClear"
      >
        <Close />
      </button>
      <span v-else :class="cls.e('arrow')" aria-hidden="true">
        <ArrowDown />
      </span>
    </span>
  </div>

  <!-- 底部选择面板（内部实现，不进公开导出） -->
  <BottomSheet
    v-model:visible="sheetVisible"
    :title="placeholder"
    :content-class="contentClass"
    :content-style="contentStyle"
  >
    <div v-if="filterable" :class="cls.e('search')">
      <input
        ref="searchRef"
        v-model="queryString"
        :class="cls.e('search-input')"
        type="text"
        placeholder="搜索"
        enterkeyhint="search"
      />
    </div>

    <div v-if="loading" :class="cls.e('loading')">加载中...</div>

    <ul
      v-else-if="options.length"
      :class="[cls.e('options'), bem.is('grid', !!grid)]"
      :style="gridStyle"
    >
      <li
        v-for="(option, index) of options"
        :key="getOptionField(option, valueKey)"
        :class="[cls.e('option'), bem.is('selected', isSelected(option))]"
        role="option"
        :aria-selected="isSelected(option)"
        @click="handleSelect(option)"
      >
        <slot :option="option" :index="index">
          <span :class="cls.e('option-label')">
            {{ getOptionField(option, labelKey) }}
          </span>
        </slot>

        <span v-if="isSelected(option) && !grid" :class="cls.e('check')" aria-hidden="true">
          <Check />
        </span>
      </li>
    </ul>

    <div v-else :class="cls.e('empty')">暂无数据</div>
  </BottomSheet>
</template>

<script lang="ts" setup>
import { ArrowDown, Check, Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { SelectEmits, SelectProps } from '../../types/select'
import { BottomSheet } from '../_internal/bottom-sheet'
import { getOptionField, useOptions } from './use-options'

defineOptions({ name: 'USelect', inheritAttrs: false })

const props = withDefaults(defineProps<SelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SelectEmits>()

defineSlots<{
  /** 前缀插槽 */
  prefix?: () => any
  /** 默认插槽 */
  default?: (scope: { option: Record<string, any>; index: number }) => any
}>()

const cls = bem('select')

const { formProps } = injectFormContext()

// 表单回滚属性：组件自身优先于表单（与 desktop 行为一致）
const size = computed(() => props.size ?? formProps?.size ?? 'default')
const disabled = computed(() => props.disabled ?? formProps?.disabled ?? false)
const readonly = computed(() => props.readonly ?? formProps?.readonly ?? false)

const labelKey = computed(() => props.labelKey || 'label')
const valueKey = computed(() => props.valueKey || 'value')

const filterable = computed(() => props.filterable || typeof props.options === 'function')

const {
  queryString,
  loading,
  options,
  allOptions,
  temOptionsToCreatedOptions,
  clearCreatedOptions
} = useOptions({ props })

/** 内部展示文案，仅由选项推导（未命中时展示 text 兜底）；经 update:text 通知父级 */
const label = shallowRef<string>()
const selected = shallowRef<Record<string, any>>()

const displayedValue = computed(() => {
  if (label.value) return label.value

  if (selected.value) return getOptionField(selected.value, labelKey.value)
  // 未命中选项：优先展示 text 兜底文案，避免露出不可读的编码
  return props.text ?? String(props.modelValue ?? '')
})

const sheetVisible = shallowRef(false)
const searchRef = useTemplateRef<HTMLInputElement>('searchRef')

/** 移动端无 hover：有值且可清除即展示清除按钮 */
const showClear = computed(() => {
  return props.clearable && !disabled.value && !!displayedValue.value
})

/** 选中临时选项后待转正标记：面板关闭后再落定，与 desktop 行为一致 */
let pendingTempPromote = false

/** 抑制内部写入引起的外部回显同步 */
let suppressEcho = false

/** 更新内部文案；值变化时 emit update:text（readonly 纯展示，不通知父级） */
function setLabel(next?: string) {
  if (label.value === next) return
  label.value = next
  if (!readonly.value) emit('update:text', next)
}

/** 按 modelValue 与完整选项列表同步选中项与显示标签（外部回显用，O(n)） */
function syncSelected(modelValue: any, sourceOptions: Record<string, any>[] | undefined) {
  if (!sourceOptions?.length) return

  if (modelValue !== undefined && modelValue !== null && modelValue !== '') {
    const index = sourceOptions.findIndex(
      (option) => getOptionField(option, valueKey.value) === modelValue
    )
    selected.value = index >= 0 ? sourceOptions[index] : undefined
    if (selected.value) {
      setLabel(getOptionField(selected.value, labelKey.value))
    } else if (props.text) {
      // 未命中但有 text 兜底：文案以父级为准，不回发
      label.value = undefined
    } else {
      // 未命中且无兜底：如实通知父级当前没有可展示文案
      setLabel(undefined)
    }
  } else {
    selected.value = undefined
    setLabel(undefined)
  }
}

// 回显：以 allOptions 匹配，避免过滤列表缺项时清掉已选文案
watch(
  [() => props.modelValue, allOptions],
  ([modelValue]) => {
    if (suppressEcho) {
      suppressEcho = false
      return
    }
    syncSelected(modelValue, allOptions.value)
  },
  { immediate: true }
)

watch(sheetVisible, (visible) => {
  if (visible) {
    // 关闭动画期间被重新打开时补一次转正，保证已选临时项落到完整列表
    promotePendingTemp()
    // 面板展开后清空查询并聚焦搜索框，可立即输入查询
    if (filterable.value) {
      queryString.value = ''
      nextTick(() => searchRef.value?.focus())
    }
  } else {
    // 面板关闭后再清空查询并转正临时项，避免列表瞬间恢复全量导致面板闪烁
    queryString.value = ''
    promotePendingTemp()
    suppressEcho = false
  }
})

/** 落定待转正的临时选项 */
function promotePendingTemp() {
  if (!pendingTempPromote) return
  pendingTempPromote = false
  temOptionsToCreatedOptions()
}

function isSelected(option: Record<string, any>) {
  if (selected.value === option) return true
  return getOptionField(option, valueKey.value) === props.modelValue
}

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

/** 单选：写入值与文案后收起面板 */
function handleSelect(option: Record<string, any>) {
  const value = getOptionField(option, valueKey.value)
  selected.value = option

  suppressEcho = true
  emit('update:modelValue', value)
  setLabel(getOptionField(option, labelKey.value))
  emit('change', option)

  if (option.__isTemp) {
    // 转正延迟到面板关闭后：动画期间保持过滤列表
    pendingTempPromote = true
  }

  sheetVisible.value = false
}

/** 清除选项 */
function handleClear() {
  selected.value = undefined
  setLabel(undefined)
  clearCreatedOptions()
  suppressEcho = true
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

const gridStyle = computed(() => {
  if (!props.grid) return undefined
  const cols = props.grid.cols
  const gap = props.grid.gap !== undefined ? `${props.grid.gap}px` : undefined
  return { gridTemplateColumns: `repeat(${cols}, minmax(0px, 1fr))`, rowGap: gap, columnGap: gap }
})
</script>
