<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    :disabled="disabled"
    v-if="!readonly"
  >
    <template #trigger>
      <input
        type="text"
        :class="cls.e('input')"
        :value="displayedOfStart"
        :placeholder="placeholder[0]"
        readonly
      />
      <span :class="cls.e('separator')">至</span>
      <input
        type="text"
        :class="cls.e('input')"
        :value="displayedOfEnd"
        :placeholder="placeholder[1]"
        readonly
      />
    </template>

    <template #content>
      <UDatePanel
        range
        :type
        :disabled-date
        :size
        :range-date="currentRangeDate"
        @select:range-date="handleSelect"
      />
    </template>
  </u-dropdown>

  <span v-else>
    {{ displayedOfStart || FORM_EMPTY_CONTENT }} 至
    {{ displayedOfEnd || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type {
  DateRangePickerEmits,
  DateRangePickerProps,
  DropdownExposed
} from '@ui/types'
import { bem } from '@ui/utils'
import { computed, shallowRef } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UDatePanel } from '../date-panel'
import { date, type Dater } from 'cat-kit/fe'

defineOptions({
  name: 'DateRangePicker'
})

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  placeholder: () => ['起始日期', '结束日期'],
  type: 'date',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<DateRangePickerEmits>()

const cls = bem('date-range-picker')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const dropdownRef = shallowRef<DropdownExposed>()

const currentRangeDate = shallowRef<[Dater, Dater] | undefined>(
  props.modelValue?.length === 2
    ? [date(props.modelValue[0]), date(props.modelValue[1])]
    : undefined
)

const displayedOfStart = computed(() => {
  return props.modelValue?.[0]
})

const displayedOfEnd = computed(() => {
  return props.modelValue?.[1]
})

const formatStr = computed(() => {
  const { format, type } = props
  if (format) return format
  if (type === 'date') return 'yyyy-MM-dd'
  if (type === 'month') return 'yyyy-MM'
  if (type === 'year') return 'yyyy'
  return 'yyyy-MM-dd'
})

function handleSelect(rangeDate: [Dater, Dater] | undefined) {
  currentRangeDate.value = rangeDate
  emit(
    'update:modelValue',
    rangeDate?.map(d => d.format(formatStr.value)) as [string, string]
  )
}
</script>
