<template>
  <!-- 只读态：纯展示标签 -->
  <div v-if="readonly && model?.length" :class="[cls.b, cls.m(size)]">
    <div :class="cls.e('tags')">
      <span v-for="option of tags" :key="getOptionField(option, valueKey)" :class="cls.e('tag')">
        {{ getOptionField(option, labelKey) }}
      </span>
    </div>
  </div>

  <template v-else-if="readonly">{{ FORM_EMPTY_CONTENT }}</template>

  <div
    v-else
    v-bind="$attrs"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('active', sheetVisible)]"
    :aria-expanded="sheetVisible"
    aria-haspopup="dialog"
    @click="handleTriggerClick"
  >
    <span v-if="!model?.length" :class="[cls.e('value'), bem.is('placeholder', true)]">
      {{ placeholder }}
    </span>

    <div v-if="model?.length" :class="cls.e('tags')">
      <span v-for="option of tags" :key="getOptionField(option, valueKey)" :class="cls.e('tag')">
        <span :class="cls.e('tag-label')">
          {{ getOptionField(option, labelKey) }}
        </span>

        <button
          v-if="!disabled"
          :class="cls.e('tag-close')"
          type="button"
          :aria-label="`移除 ${getOptionField(option, labelKey)}`"
          @click.stop="handleTagClose(option)"
        >
          <Close />
        </button>
      </span>

      <span v-if="restTag" :class="[cls.e('tag'), bem.is('rest', true)]"> {{ restTag }}+ </span>
    </div>

    <span :class="cls.e('icons')">
      <button
        v-if="clearable && model?.length && !disabled"
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

  <!-- 底部多选面板（内部实现，不进公开导出）：确定/取消，勾选结果暂存至确认 -->
  <BottomSheet
    v-model:visible="sheetVisible"
    :title="placeholder"
    :content-class="contentClass"
    :content-style="contentStyle"
  >
    <template #header>
      <button :class="cls.e('cancel')" type="button" @click="sheetVisible = false">取消</button>
      <span :class="cls.e('title')">{{ placeholder }}</span>
      <button :class="cls.e('confirm')" type="button" @click="handleConfirm">确定</button>
    </template>

    <div v-if="filterable" :class="cls.e('search')">
      <input
        ref="searchRef"
        v-model="queryString"
        :class="cls.e('search-input')"
        type="text"
        placeholder="搜索"
        enterkeyhint="search"
        @keydown.enter.prevent="handleCreateByEnter"
      />
    </div>

    <template v-if="!loading && options.length">
      <div :class="cls.e('content-header')">
        <button
          :class="[cls.e('check-all'), bem.is('disabled', max !== undefined)]"
          type="button"
          @click="handleCheckAll"
        >
          <span :class="[cls.e('checkbox'), bem.is('checked', allChecked)]">
            <Check v-if="allChecked" />
            <Minus v-else-if="indeterminate" />
          </span>
          全选
        </button>

        <span :class="cls.e('count')"> 已选 {{ staged.length }}/{{ max ?? options.length }} </span>
      </div>

      <ul :class="cls.e('options')">
        <li
          v-for="(option, index) of options"
          :key="getOptionField(option, valueKey)"
          :class="[cls.e('option'), bem.is('disabled', isDisabled(option))]"
          role="option"
          :aria-selected="isChecked(option)"
          @click="handleCheck(option)"
        >
          <span :class="[cls.e('checkbox'), bem.is('checked', isChecked(option))]">
            <Check v-if="isChecked(option)" />
          </span>

          <slot :option="option" :index="index">
            <span :class="cls.e('option-label')">
              {{ getOptionField(option, labelKey) }}
            </span>
          </slot>
        </li>
      </ul>
    </template>

    <div v-else-if="loading" :class="cls.e('loading')">加载中...</div>
    <div v-else :class="cls.e('empty')">暂无数据</div>
  </BottomSheet>
</template>

<script lang="ts" setup>
import { ArrowDown, Check, Close, Minus } from '@veltra/icons/normal'
import { FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { MultiSelectEmits, MultiSelectProps } from '../../types/multi-select'
import { BottomSheet } from '../_internal/bottom-sheet'
import { getOptionField, useOptions } from '../select/use-options'

defineOptions({ name: 'UMultiSelect', inheritAttrs: false })

const props = withDefaults(defineProps<MultiSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  visibilityLimit: 3,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<MultiSelectEmits>()

defineSlots<{
  /** 默认插槽 */
  default?: (scope: { option: Record<string, any>; index: number }) => any
}>()

const cls = bem('multi-select')

const { formProps } = injectFormContext()

// 表单回滚属性：组件自身优先于表单（与 desktop 行为一致）
const size = computed(() => props.size ?? formProps?.size ?? 'default')
const disabled = computed(() => props.disabled ?? formProps?.disabled ?? false)
const readonly = computed(() => props.readonly ?? formProps?.readonly ?? false)

const labelKey = computed(() => props.labelKey || 'label')
const valueKey = computed(() => props.valueKey || 'value')

const model = defineModel<Array<any>>()

const filterable = computed(() => {
  return props.filterable || props.creatable || typeof props.options === 'function'
})

const {
  options: rawOptions,
  queryString,
  loading,
  allOptions: rawAllOptions
} = useOptions({ props })

// 已创建选项：勾选临时项时立即转正（与 desktop 行为一致），取消不回退已创建项
const createdOptions = shallowRef<Record<string, any>[]>([])

const options = computed(() => {
  const base = rawOptions.value
  if (!props.creatable || !createdOptions.value.length) return base

  const createdValues = new Set(createdOptions.value.map((o) => getOptionField(o, valueKey.value)))
  const deduped = base.filter(
    (o) => !(o.__isTemp && createdValues.has(getOptionField(o, valueKey.value)))
  )
  const dedupedValues = new Set(deduped.map((o) => getOptionField(o, valueKey.value)))
  const toAdd = createdOptions.value.filter(
    (o) => !dedupedValues.has(getOptionField(o, valueKey.value))
  )
  return [...toAdd, ...deduped]
})

const allOptions = computed(() => {
  if (!props.creatable || !createdOptions.value.length) return rawAllOptions.value
  return [...createdOptions.value, ...rawAllOptions.value]
})

const optionsMap = computed(() => {
  return new Map<string | number, Record<string, any>>(
    allOptions.value.map((option) => [getOptionField(option, valueKey.value), option])
  )
})

/** 面板打开期间的暂存勾选值：确定时落盘，取消时丢弃 */
const staged = shallowRef<Array<any>>([])

const sheetVisible = shallowRef(false)
const searchRef = useTemplateRef<HTMLInputElement>('searchRef')

watch(sheetVisible, (visible) => {
  if (!visible) {
    queryString.value = ''
    return
  }
  staged.value = [...(model.value ?? [])]
  if (filterable.value) {
    queryString.value = ''
    nextTick(() => searchRef.value?.focus())
  }
})

const allChecked = computed(() => {
  const selectable = options.value.filter((o) => !o.__isTemp)
  return (
    selectable.length > 0 &&
    selectable.every((o) => staged.value.includes(getOptionField(o, valueKey.value)))
  )
})

const indeterminate = computed(() => {
  return staged.value.length > 0 && !allChecked.value
})

function isChecked(option: Record<string, any>) {
  return staged.value.includes(getOptionField(option, valueKey.value))
}

/** 达到 max 且未勾选的选项禁用（与 desktop 行为一致） */
function isDisabled(option: Record<string, any>) {
  const { max } = props
  return max !== undefined && staged.value.length >= max && !isChecked(option)
}

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

/** 面板内勾选/取消勾选：只写暂存，待确定落盘 */
function handleCheck(option: Record<string, any>) {
  if (isDisabled(option)) return

  const value = getOptionField(option, valueKey.value)

  if (option.__isTemp && props.creatable) {
    // 勾选临时项：立即转正为已创建选项并加入暂存
    const created: Record<string, any> = {
      [labelKey.value]: getOptionField(option, labelKey.value),
      [valueKey.value]: value
    }
    createdOptions.value = [...createdOptions.value, created]
    staged.value = [...staged.value, value]
    queryString.value = ''
    return
  }

  staged.value = staged.value.includes(value)
    ? staged.value.filter((v) => v !== value)
    : [...staged.value, value]
}

/** 全选/清空暂存（受 max 限制时不可用，与 desktop 行为一致；临时项不参与全选） */
function handleCheckAll() {
  if (props.max !== undefined) return

  staged.value = allChecked.value
    ? []
    : options.value.filter((o) => !o.__isTemp).map((o) => getOptionField(o, valueKey.value))
}

/** 搜索框回车创建选项（与 desktop 行为一致） */
function handleCreateByEnter() {
  if (!props.creatable) return
  const qs = queryString.value?.trim()
  if (!qs) return

  const label = labelKey.value
  const existing =
    createdOptions.value.find((o) => getOptionField(o, valueKey.value) === qs) ??
    rawOptions.value.find((o) => !o.__isTemp && getOptionField(o, label) === qs)

  if (existing) {
    const value = getOptionField(existing, valueKey.value)
    if (!staged.value.includes(value)) staged.value = [...staged.value, value]
  } else {
    const created: Record<string, any> = { [label]: qs, [valueKey.value]: qs }
    createdOptions.value = [...createdOptions.value, created]
    staged.value = [...staged.value, qs]
  }

  queryString.value = ''
}

/** 确定：暂存落盘并通知父级 */
function handleConfirm() {
  model.value = [...staged.value]
  emit('change', staged.value.map((v) => optionsMap.value.get(v)).filter(Boolean))
  sheetVisible.value = false
}

/** 移除触发器上的单个标签（立即生效） */
function handleTagClose(option: Record<string, any>) {
  const value = getOptionField(option, valueKey.value)
  model.value = (model.value ?? []).filter((v) => v !== value)
  createdOptions.value = createdOptions.value.filter(
    (o) => getOptionField(o, valueKey.value) !== value
  )
  staged.value = staged.value.filter((v) => v !== value)
  emitChange()
}

/** 清除全部（立即生效） */
function handleClear() {
  model.value = []
  createdOptions.value = []
  staged.value = []
  emitChange()
}

function emitChange() {
  emit('change', (model.value ?? []).map((v) => optionsMap.value.get(v)).filter(Boolean))
}

const tags = computed(() => {
  const tags: Record<string, any>[] = []
  let { visibilityLimit } = props
  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }

  // 禁用/只读时显示全部（与 desktop 行为一致）
  if (disabled.value || readonly.value) {
    visibilityLimit = model.value?.length ?? 0
  }

  model.value?.slice(0, visibilityLimit).forEach((k) => {
    const option = optionsMap.value.get(k)
    option && tags.push(option)
  })

  return tags
})

const restTag = computed(() => {
  return (model.value?.length ?? 0) - tags.value.length
})
</script>
