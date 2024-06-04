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
        @clear="handleClear"
        @input="onInput"
        v-model="currentValue"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <u-scroll tag="ul" :class="cls.e('options')" ref="scrollRef">
        <li
          v-for="(option, index) of filteredOptions"
          :class="[optionClass, bem.is('selected', option === currentValue)]"
          @click="handleSelect(option as Option)"
          v-ripple="cls.e('ripple')"
          :data-key="option[labelKey] || option"
          :key="option[labelKey] || option"
        >
          <slot v-bind="{ option, index }">
            {{ labelKey ? option[labelKey] : option }}
          </slot>
        </li>
      </u-scroll>
    </template>
  </u-dropdown>

  <span v-else>{{ currentValue }}</span>
</template>

<script lang="ts" setup generic="Option extends Record<string, any> | string">
import { shallowRef, ref, watch } from 'vue'
import type {
  AutoCompleteEmits,
  AutoCompleteProps,
  _AutoCompleteExposed
} from '@ui/types/components/auto-complete'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll, type ScrollExposed } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown } from 'icon-ultra'
import { vRipple } from '@ui/directives'
import { deepCopy } from 'cat-kit/fe'

defineOptions({
  name: 'AutoComplete',
  inheritAttrs: false
})

const props = withDefaults(defineProps<AutoCompleteProps<Option>>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  linker: '：',
  labelKey: ''
})

const currentValue = shallowRef<string>('')

const emit = defineEmits<AutoCompleteEmits>()

const cls = bem('auto-complete')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

watch(scrollRef, scroll => {
  if (scroll && currentValue.value !== undefined) {
    const li = scroll.contentRef!.querySelector(`li[data-key="${currentValue.value}"]`)
    li?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})

/** 已过滤的选项 */
const filteredOptions = ref<Option[]>([])

/** 单选 */
const handleSelect = (option: Option) => {
  currentValue.value = option[props.labelKey] || option
  dropdownRef.value?.close()
  emit('complete', currentValue.value)
}

/** 清除选项 */
const handleClear = () => {
  filteredOptions.value = []
}

const suggestionsCopy = deepCopy(props.suggestions)

const dropdownVisible = shallowRef(false)

const onInput = () => {
  if (!dropdownVisible.value) dropdownRef.value?.open()
  if (currentValue.value) {
    filteredOptions.value = suggestionsCopy.map((item) => {
      return item[props.labelKey]
        ? `${currentValue.value}${props.linker}${[props.labelKey]}`
        : `${currentValue.value}${props.linker}${item}`
    })
    emit('complete', currentValue.value)
  } else {
    filteredOptions.value = []
  }
  emit('update:modelValue', currentValue.value)
}
</script>
