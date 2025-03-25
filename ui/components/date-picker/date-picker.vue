<template>
  <u-dropdown
    :class="className"
    trigger="click"
    width="auto"
    ref="dropdownRef"
    @update:visible=""
    :disabled="disabled"
    v-if="!readonly"
  >
    <template #trigger>
      <u-input
        :size="size"
        native-readonly
        :clearable="clearable"
        :placeholder="placeholder"
        :model-value="displayedValue"
        :disabled="disabled"
      >
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <UDatePanel
        :size
        :type
        :disabled-date
        :date="currentDate"
        @select:date="handleSelectDate"
      />
    </template>
  </u-dropdown>

  <span v-else>
    {{ displayedValue || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import type { DatePickerEmits, DatePickerProps } from '@ui/types'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { computed, shallowRef } from 'vue'
import { Calendar } from 'icon-ultra'
import { UDatePanel } from '../date-panel'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { DropdownExposed } from '@ui/types'
import { date, type Dater } from 'cat-kit/fe'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  type: 'date',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<DatePickerEmits>()

const cls = bem('date-picker')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const dropdownRef = shallowRef<DropdownExposed>()

const formatStr = computed(() => {
  const { format, type } = props
  if (format) return format
  if (type === 'date') return 'yyyy-MM-dd'
  if (type === 'month') return 'yyyy-MM'
  if (type === 'year') return 'yyyy'
  return 'yyyy-MM-dd'
})

const currentDate = shallowRef(
  props.modelValue ? date(props.modelValue) : undefined
)

const displayedValue = computed(() => {
  return currentDate.value?.format(formatStr.value) ?? ''
})

function handleSelectDate(date: Dater) {
  currentDate.value = date
  emit('update:modelValue', date.format(formatStr.value))
  dropdownRef.value?.close()
}
</script>
