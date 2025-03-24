<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    @update:visible=""
    :disabled="disabled"
    v-if="!readonly"
  >
    <template #trigger>
      <input type="text" />
    </template>

    <template #content>
      <DatePickerPanel />
      <DatePickerPanel />
    </template>
  </u-dropdown>

  <span v-else>
    {{ displayedOfStart || FORM_EMPTY_CONTENT }} 至
    {{ displayedOfEnd || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { DateRangePickerProps, DropdownExposed } from '@ui/types'
import { bem } from '@ui/utils'
import { computed, shallowRef } from 'vue'
import DatePickerPanel from '../date-picker/date-picker-panel.vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

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

const displayedOfStart = computed(() => {
  return props.modelValue?.[0]
})

const displayedOfEnd = computed(() => {
  return props.modelValue?.[1]
})
</script>
