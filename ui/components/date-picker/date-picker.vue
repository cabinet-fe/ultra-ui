<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    @update:visible="handleDropdownVisibleChange"
    :disabled="disabled"
    v-if="!readonly"
  >
    <template #trigger>
      <u-input :size="size" readonly :placeholder="placeholder" v-model="model">
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <DatePickerPanel v-model:date="selectedDate" @close-dropdown="dropdownRef?.close()" />
    </template>
  </u-dropdown>

  <span v-else>
    {{ model }}
  </span>
</template>

<script lang="ts" setup>
import type { DatePickerProps } from '@ui/types/components/date-picker'
import { bem } from '@ui/utils'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { computed, provide, shallowRef, watch } from 'vue'
import { Calendar } from 'icon-ultra'
import { type Dater, date } from 'cat-kit/fe'
import DatePickerPanel from './date-picker-panel.vue'
import { DatePickerDIKey } from './di'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  format: 'yyyy-MM-dd',
  disabled: undefined,
  readonly: undefined
})

const cls = bem('date-picker')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const selectedDate = shallowRef<Dater>()
const model = defineModel<string>()
const displayedText = shallowRef<string>()

let isChangedByModel = false
let isChangedBySelectedDate = false
watch(selectedDate, currentDate => {
  if (isChangedByModel) return

  isChangedBySelectedDate = true
  if (currentDate) {
    model.value = currentDate.format(props.valueFormat || props.format)
    if (props.valueFormat) {
      displayedText.value = currentDate.format(props.format)
    }
  } else {
    model.value = undefined
    displayedText.value = undefined
  }
  isChangedBySelectedDate = false
})

watch(
  model,
  model => {
    if (isChangedBySelectedDate) return

    isChangedByModel = true
    if (model) {
      selectedDate.value = date(model)
    } else {
      selectedDate.value = undefined
    }
    isChangedByModel = false
  },
  { immediate: true }
)

const dropdownRef = shallowRef<DropdownExposed>()

const handleDropdownVisibleChange = (visible: boolean) => {
  if (!visible) return
}

provide(DatePickerDIKey, {
  cls,
  datePickerProps: props
})
</script>
