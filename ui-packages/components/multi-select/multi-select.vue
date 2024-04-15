<template>
  <u-dropdown
    trigger="click"
    :class="cls.b"
    min-width="200px"
    ref="dropdownRef"
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        :size="size"
        readonly
        :disabled="disabled"
        :placeholder="props.placeholder"
        :clearable="props.clearable"
        @clear="handleClear"
      >
        <template #suffix>
          <u-icon><ArrowDown /></u-icon>
        </template>
      </u-input>

      <!-- <div>
        <u-tag></u-tag>
      </div> -->
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.e('content-filter')">
        <u-input placeholder="输入关键字进行过滤" v-model="queryString">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <!-- 多选栏 -->
      <div :class="cls.e('content-header')">
        <u-checkbox @update:model-value="handleCheckAll"> 全选 </u-checkbox>
        <u-icon @click="dropdownRef?.close()">
          <Close />
        </u-icon>
      </div>

      <!-- 多选列表 -->
      <u-scroll tag="ul" :class="cls.e('options')">
        <li
          v-for="(option, index) of filteredOptions"
          :class="[optionClass]"
          v-ripple
        >
          <u-checkbox :model-value="checked.has(option[props.valueKey])" />

          <slot v-bind="{ option, index }">
            {{ option[props.labelKey] }}
          </slot>
        </li>
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="M extends boolean | undefined">
import { computed, shallowRef, shallowReactive, watchEffect, watch } from 'vue'
import type { MultiSelectEmits, MultiSelectProps } from '@ui/types/components/multi-select'
import { bem } from '@ui/utils'
import { UTag } from '../tag'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UCheckbox } from '../checkbox'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search, Close } from 'icon-ultra'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'Select'
})

const props = withDefaults(defineProps<MultiSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true
})

const emit = defineEmits<MultiSelectEmits>()

const cls = bem('select')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const model = defineModel<Array<string | number>>()
const checked = shallowReactive<Set<string | number>>(new Set())

const dropdownRef = shallowRef<DropdownExposed>()

watch(
  [model, () => props.options],
  ([model, options]) => {
    if (!options?.length) return

    if (model) {
    } else {
    }
  },
  { immediate: true }
)

/** 筛选 */
const queryString = shallowRef('')

/** 已过滤的选项 */
const filteredOptions = computed(() => {
  const { options, labelKey } = props
  if (queryString.value === '') return options

  return options.filter(item => item[labelKey].includes(queryString.value))
})

/** 全选 */
const handleCheckAll = (_checked: boolean) => {
  const { options, valueKey } = props
  if (_checked) {
    options.forEach(item => {
      item[valueKey] && checked.add(item[valueKey])
    })
  } else {
    checked.clear()
  }
}

/** 清除选项 */
const handleClear = () => {
  model.value = []
  checked.clear()
}
</script>
