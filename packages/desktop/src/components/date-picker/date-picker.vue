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
      <UDatePanel
        :size
        :type
        :disabled-date
        :date="currentDate"
        @select:date="handleSelectDate"
      />
    </template>
  </u-dropdown>

  <template v-else>
    {{ displayedValue || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import type { DatePickerEmits, DatePickerProps } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'
import { UDropdown } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock
} from '@ultra-ui/compositions'
import { computed, shallowRef, watch } from 'vue'
import { Calendar } from '@ultra/icon'
import { UDatePanel } from '../date-panel'
import { FORM_EMPTY_CONTENT } from '@ultra-ui/utils'
import type { DropdownExposed } from '@ultra-ui/desktop/types'
import { date, type Dater } from '@cat-kit/core'

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

const currentDate = shallowRef<Dater>()

const { update, updateAndLock } = useUpdateLock()

watch(
  () => props.modelValue,
  modelValue => {
    update(() => {
      currentDate.value = modelValue ? date(modelValue) : undefined
    })
  },
  { immediate: true }
)

const displayedValue = computed(() => {
  return currentDate.value?.format(formatStr.value) ?? ''
})

async function handleSelectDate(date: Dater) {
  await updateAndLock(() => {
    currentDate.value = date
    emit('update:modelValue', date.format(formatStr.value))
  })
  dropdownRef.value?.close()
}

function handleClear() {
  currentDate.value = undefined
  emit('update:modelValue', undefined)
}
</script>
