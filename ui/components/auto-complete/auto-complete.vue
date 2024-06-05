<template>
  <u-dropdown
    v-if="!readonly"
    trigger="click"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('multiple', multiple)]"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    :disabled="disabled"
  >
    <!-- 触发 -->
    <template #trigger>
      <ul v-if="multiple" :class="cls.e('tags')">
        <li v-for="(option, index) of tags" :class="cls.e('tag')">
          <u-tag
            :key="labelKey ? option[labelKey] : option"
            :closable="!disabled"
            @close="handleClose(index)"
          >
            {{ labelKey ? option[labelKey] : option }}
          </u-tag>
        </li>
        <li v-if="!disabled && !readonly">
          <u-input
            :size="size"
            :disabled="disabled"
            :placeholder="placeholder"
            :clearable="false"
            @clear="handleClear"
            @native:input="onInput"
            v-model="currentValue"
            style="box-shadow: none; height: 24px"
          >
          </u-input>
        </li>
      </ul>

      <u-input
        v-else
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        @clear="handleClear"
        @native:input="onInput"
        v-model="currentValue"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>

      <u-icon v-if="multiple" :class="cls.e('arrow')"><ArrowDown /></u-icon>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <u-scroll tag="ul" :class="cls.e('options')" ref="scrollRef">
        <li
          v-for="(option, index) of filteredOptions"
          :class="[
            optionClass,
            bem.is(
              'selected',
              multiple ? tags.includes(option[labelKey] || option) : option === currentValue
            )
          ]"
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

  <template v-else>
    <div :class="[cls.m(size), bem.is('multiple', multiple)]" v-if="multiple">
      <div :class="cls.e('tags')">
        <u-tag v-for="option of tags" :key="labelKey ? option[labelKey] : option">
          {{ labelKey ? option[labelKey] : option }}
        </u-tag>
      </div>
    </div>
    <span v-else>{{ currentValue }}</span>
  </template>
</template>

<script lang="ts" setup generic="Option extends Record<string, any> | string">
import { shallowRef, ref, watch, nextTick } from 'vue'
import type {
  AutoCompleteEmits,
  AutoCompleteProps,
  _AutoCompleteExposed
} from '@ui/types/components/auto-complete'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll, type ScrollExposed } from '../scroll'
import { UIcon } from '../icon'
import { ArrowDown } from 'icon-ultra'
import { vRipple } from '@ui/directives'
import { deepCopy, equal, isArray } from 'cat-kit/fe'
import { UTag } from '../tag'
import { UInput } from '../input'

defineOptions({
  name: 'AutoComplete'
})

const props = withDefaults(defineProps<AutoCompleteProps<Option>>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  linker: '',
  labelKey: '',
  multiple: false
})

const currentValue = shallowRef<string>('')

const tags = ref<string[]>([])

const handleClose = (index: number) => {
  tags.value.splice(index, 1)
  emit('update:modelValue', tags.value)
}

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

watch(scrollRef, (scroll) => {
  if (scroll && currentValue.value !== undefined) {
    const li = scroll.contentRef!.querySelector(`li[data-key="${currentValue.value}"]`)
    li?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})

/** 已过滤的选项 */
const filteredOptions = ref<Option[]>([])

/** 单选 */
const handleSelect = (option: Option) => {
  if (props.multiple) {
    tags.value.push(props.labelKey ? option[props.labelKey] : option)
    currentValue.value = ''
    emit('update:modelValue', tags.value)
  } else {
    currentValue.value = props.labelKey ? option[props.labelKey] : option
    emit('update:modelValue', currentValue.value)
  }
  dropdownRef.value?.close()
}

/** 清除选项 */
const handleClear = () => {
  filteredOptions.value = []
}

const suggestionsCopy = deepCopy(props.suggestions)

const dropdownVisible = shallowRef(false)

const onInput = () => {
  nextTick(() => {
    if (!dropdownVisible.value) dropdownRef.value?.open()
    if (currentValue.value) {
      filteredOptions.value = suggestionsCopy.map((item) => {
        return item[props.labelKey]
          ? `${currentValue.value}${props.linker}${[props.labelKey]}`
          : `${currentValue.value}${props.linker}${item}`
      })
    } else {
      filteredOptions.value = []
    }
  })
}

watch(
  () => dropdownVisible.value,
  (visible) => {
    if (!visible && currentValue.value)
      if (props.multiple) {
        emit('update:modelValue', [...tags.value, currentValue.value])
        currentValue.value = ''
      } else {
        emit('update:modelValue', currentValue.value)
      }
  }
)

watch(
  () => props.modelValue,
  (modelValue) => {
    if (isArray(modelValue)) {
      if (!equal(modelValue, tags.value)) tags.value = [...(modelValue || [])]
    } else {
      if (currentValue.value !== modelValue) currentValue.value = String(modelValue || '')
    }
  },
  { immediate: true }
)
</script>