<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    @update:visible="$event && updatePanelDate()"
    :disabled="disabled"
    v-if="!readonly"
  >
    <template #trigger>
      <u-input
        :size="size"
        native-readonly
        :placeholder="placeholder"
        :model-value="modelValue"
        @update:model-value="v => emit('update:modelValue', v)"
      >
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <DatePickerPanel />
    </template>
  </u-dropdown>

  <span v-else>
    {{ modelValue || FORM_EMPTY_CONTENT }}
  </span>
</template>

<script lang="ts" setup>
import type {
  DatePickerEmits,
  DatePickerProps
} from '@ui/types/components/date-picker'
import { bem } from '@ui/utils'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { computed, shallowRef } from 'vue'
import { Calendar } from 'icon-ultra'
import DatePickerPanel from './date-picker-panel.vue'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import { useDate } from './use-date'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  type: 'date',
  disabled: undefined,
  readonly: undefined
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

const { updatePanelDate } = useDate('provide', {
  props,
  emit,
  closeDropdown: () => dropdownRef.value?.close()
})
</script>
