<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    :class="className"
    trigger="click"
    width="auto"
    ref="dropdownRef"
    @update:visible=""
    :disabled="disabled"
  >
    <template #trigger>
      <u-input
        :size="size"
        native-readonly
        :clearable="clearable"
        :placeholder="placeholder"
        :model-value="displayedValue"
        :disabled="disabled"
        @clear="handleClear"
      >
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <UDatePanel :size :type :disabled-date :date="currentDate" @select:date="handleSelectDate" />
    </template>
  </u-dropdown>

  <template v-else>
    {{ displayedValue || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { date, Dater } from '@cat-kit/core'
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { Calendar } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type { DatePickerEmits, DatePickerProps } from '../../types'
import type { DropdownExposed } from '../../types'
import { UDatePanel } from '../date-panel'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'
import { UInput } from '../input'

defineOptions({ name: 'UDatePicker', inheritAttrs: false })

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  type: 'date',
  dataType: 'string',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<DatePickerEmits>()

const cls = bem('date-picker')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

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

const currentDate = shallowRef<Dater>()

const { userAction, isUserActive } = useUserAction()

function parseModelValue(val?: string | number | Date): Dater | undefined {
  if (val == null || val === '') return undefined
  if (val instanceof Date || typeof val === 'number') {
    const d = date(val)
    return isNaN(d.timestamp) ? undefined : d
  }
  if (typeof val === 'string') {
    if (props.dataType === 'string' && props.valueFormat) {
      const parsed = Dater.parse(val, props.valueFormat)
      if (!isNaN(parsed.timestamp)) return parsed
    }
    const fallback = date(val)
    return isNaN(fallback.timestamp) ? undefined : fallback
  }
  return undefined
}

watch(
  () => props.modelValue,
  (modelValue) => {
    if (isUserActive()) return
    currentDate.value = parseModelValue(modelValue)
  },
  { immediate: true }
)

const displayedValue = computed(() => {
  return currentDate.value?.format(formatStr.value) ?? ''
})

function formatModelValue(d: Dater) {
  if (props.dataType === 'date') {
    return d.raw
  }
  if (props.dataType === 'timestamp') {
    return d.timestamp
  }
  return d.format(props.valueFormat ?? formatStr.value)
}

const commitSelectedDate = userAction((date: Dater) => {
  currentDate.value = date
  emit('update:modelValue', formatModelValue(date))
  emit('change', date.raw)
})

async function handleSelectDate(date: Dater) {
  await commitSelectedDate(date)
  dropdownRef.value?.close()
}

function handleClear() {
  currentDate.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}
</script>
