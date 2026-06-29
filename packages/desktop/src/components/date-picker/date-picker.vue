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
import { date, type Dater } from '@cat-kit/core'
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

defineOptions({ name: 'UDatePicker' })

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  type: 'date',
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

watch(
  () => props.modelValue,
  (modelValue) => {
    if (isUserActive()) return
    currentDate.value = modelValue ? date(modelValue) : undefined
  },
  { immediate: true }
)

const displayedValue = computed(() => {
  return currentDate.value?.format(formatStr.value) ?? ''
})

const commitSelectedDate = userAction((date: Dater) => {
  currentDate.value = date
  emit('update:modelValue', date.format(formatStr.value))
})

async function handleSelectDate(date: Dater) {
  await commitSelectedDate(date)
  dropdownRef.value?.close()
}

function handleClear() {
  currentDate.value = undefined
  emit('update:modelValue', undefined)
}
</script>
