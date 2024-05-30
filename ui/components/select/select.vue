<template>
  <u-dropdown
    v-if="!readonly"
    trigger="click"
    :class="[cls.b, bem.is('disabled', disabled)]"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    :disabled="disabled"
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="label || selected?.[labelKey]"
        @clear="handleClear"
        native-readonly
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
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

      <!-- 单选列表 -->
      <u-scroll
        v-if="filteredOptions.length"
        tag="ul"
        :class="cls.e('options')"
        ref="scrollRef"
      >
        <li
          v-for="(option, index) of filteredOptions"
          :class="[optionClass, bem.is('selected', option[valueKey] === model)]"
          @click="handleSelect(option)"
          v-ripple="cls.e('ripple')"
          :data-key="option[valueKey]"
          :key="option[valueKey]"
        >
          <slot v-bind="{ option, index }">
            {{ option[labelKey] }}
          </slot>
        </li>
      </u-scroll>

      <div v-else :class="cls.e('empty')">未查询到结果</div>
    </template>
  </u-dropdown>

  <span v-else>{{ label || selected?.[labelKey] }}</span>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { computed, shallowRef, watch } from 'vue'
import type {
  SelectEmits,
  SelectProps,
  _SelectExposed
} from '@ui/types/components/select'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll, type ScrollExposed } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search } from 'icon-ultra'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'Select'
})

const props = withDefaults(defineProps<SelectProps<Option>>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SelectEmits<Option>>()

const cls = bem('select')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const model = defineModel<string | number>()
const label = defineModel('text')
const selected = shallowRef<Record<string, any>>()

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

let modelIsChangedBySelected = false
let setIsChangedByModel = false
watch(
  [model, () => props.options],
  ([model, options]) => {
    if (!options?.length || modelIsChangedBySelected) return

    setIsChangedByModel = true
    if (model !== undefined) {
      const { valueKey } = props
      selected.value = options.find(option => option[valueKey] === model)
    } else {
      selected.value = undefined
    }
    setIsChangedByModel = false
  },
  { immediate: true }
)
watch(selected, selected => {
  if (setIsChangedByModel) return

  modelIsChangedBySelected = true

  model.value = selected?.[props.valueKey]
  label.value = selected?.[props.labelKey]

  modelIsChangedBySelected = false
})

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    const li = scroll.contentRef!.querySelector(`li[data-key="${model.value}"]`)
    li?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})

/** 筛选 */
const queryString = shallowRef('')

const dropdownVisible = shallowRef(false)

watch(dropdownVisible, v => {
  if (!v) {
    queryString.value = ''
  }
})

/** 已过滤的选项 */
const filteredOptions = computed(() => {
  const { options, labelKey } = props
  if (queryString.value === '') return options

  return options.filter(item => item[labelKey].includes(queryString.value))
})

/** 单选 */
const handleSelect = (option: Option) => {
  selected.value = option
  dropdownRef.value?.close()
  emit('change', option)
}

/** 清除选项 */
const handleClear = () => {
  selected.value = undefined
}
</script>
