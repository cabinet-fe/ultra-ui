<template>
  <u-dropdown
    trigger="click"
    min-width="200px"
    ref="dropdownRef"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- 触发 -->
    <template #trigger>
      <span :class="cls.e('placeholder')" v-if="!model?.length">
        {{ placeholder }}
      </span>

      <div v-else :class="cls.e('tags')">
        <u-tag
          v-for="option of tags"
          :key="option[valueKey]"
          closable
          @close="handleClose(option)"
        >
          {{ option[labelKey] }}
        </u-tag>

        <u-tag v-if="restTag"> {{ restTag }}+ </u-tag>
      </div>

      <Transition name="zoom-in">
        <u-icon
          v-if="clearable && model?.length && hovered && !disabled"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
      </Transition>

      <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 多选栏 -->
      <div :class="cls.e('content-header')">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>

        <span> 已选 {{ model?.length }}/{{ max ?? options.length }} </span>
      </div>

      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.e('content-filter')">
        <u-input placeholder="输入关键字进行过滤" v-model="queryString">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <!-- 多选列表 -->
      <u-scroll
        tag="ul"
        :class="cls.e('options')"
        v-if="filteredOptions.length"
      >
        <u-multi-select-option
          v-for="(option, index) of filteredOptions"
          :option="option"
          :disabled="isDisabled(option)"
          :key="option[valueKey]"
          @check="handleCheck"
        >
          <slot v-bind="{ option, index }">
            {{ option[labelKey] }}
          </slot>
        </u-multi-select-option>
      </u-scroll>

      <div v-else :class="cls.e('empty')">未查询到结果</div>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { computed, shallowRef, shallowReactive, watch, provide } from 'vue'
import type {
  MultiSelectEmits,
  MultiSelectProps
} from '@ui/types/components/multi-select'
import { bem } from '@ui/utils'
import { UTag } from '../tag'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UCheckbox } from '../checkbox'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search, Close } from 'icon-ultra'

import UMultiSelectOption from './multi-select-option.vue'
import { MultiSelectDIKey } from './di'

defineOptions({
  name: 'MultiSelect'
})

const props = withDefaults(defineProps<MultiSelectProps<Option>>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  visibilityLimit: 3,
  disabled: undefined
})

const emit = defineEmits<MultiSelectEmits>()

const cls = bem('multi-select')

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const hovered = shallowRef(false)

const model = defineModel<Array<string | number>>()
const checkedSet = shallowReactive<Set<Option>>(new Set())
const allChecked = computed(() => {
  return checkedSet.size === props.options.length
})
const indeterminate = computed(() => {
  return checkedSet.size > 0 && !allChecked.value
})

const optionsMap = computed(() => {
  const { valueKey, options } = props
  return new Map<string | number, Option>(
    options.map(option => [option[valueKey], option])
  )
})

const dropdownRef = shallowRef<DropdownExposed>()

// 当model是通过checkedSet改变而更新时不触发model watch处理函数
let modelIsChangedBySet = false
let setIsChangedByModel = false
watch(
  [model, optionsMap],
  ([model, optionsMap]) => {
    if (!optionsMap.size || !model?.length || modelIsChangedBySet) return

    setIsChangedByModel = true
    model.forEach(v => {
      const option = optionsMap.get(v)
      option && checkedSet.add(option)
    })
    setIsChangedByModel = false
  },
  { immediate: true }
)

watch(checkedSet, () => {
  if (setIsChangedByModel) return
  const { valueKey } = props
  modelIsChangedBySet = true
  model.value = Array.from(checkedSet).map(option => option[valueKey])
  modelIsChangedBySet = false
})

const tags = computed(() => {
  let tags: Option[] = []
  let { visibilityLimit } = props
  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }
  model.value?.slice(0, visibilityLimit).forEach(k => {
    const option = optionsMap.value.get(k)
    option && tags.push(option)
  })

  return tags
})

const restTag = computed(() => {
  return (model.value?.length ?? 0) - tags.value.length
})

/** 筛选 */
const queryString = shallowRef('')

/** 已过滤的选项 */
const filteredOptions = computed(() => {
  const { options, labelKey } = props
  if (queryString.value === '') return options

  return options.filter(item => item[labelKey].includes(queryString.value))
})

const handleCheck = (option: Option, checked: boolean) => {
  if (checked) {
    checkedSet.add(option)
  } else {
    checkedSet.delete(option)
  }
}

/** 全选 */
const handleCheckAll = (checked: boolean) => {
  if (checked) {
    props.options.forEach(option => checkedSet.add(option))
  } else {
    checkedSet.clear()
  }
}

/** 清除选项 */
const handleClear = () => {
  model.value = []
  checkedSet.clear()
}

const handleClose = (option: Option) => {
  checkedSet.delete(option)
}

const isDisabled = (option: Option) => {
  const { max } = props
  return (max !== undefined && checkedSet.size >= max) && !checkedSet.has(option)
}

const optionClass = cls.e('option')
const rippleClass = cls.e('ripple')

provide(MultiSelectDIKey, {
  multiSelectProps: props,
  checkedSet,
  optionClass,
  rippleClass
})
</script>
