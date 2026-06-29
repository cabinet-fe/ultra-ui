<template>
  <u-dropdown
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    :disabled="disabled"
    @mouseenter.native="hovered = true"
    @mouseleave.native="hovered = false"
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

      <Transition name="zoom-in" mode="out-in">
        <UIcon
          v-if="clearable && modelValue && hovered && !disabled"
          :class="[cls.e('icon'), cls.e('clear')]"
          title="清除"
          @click.stop="handleClear"
        >
          <Close />
        </UIcon>

        <u-icon :class="cls.e('icon')" v-else><Calendar /></u-icon>
      </Transition>
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

  <template v-else>
    {{ displayedOfStart || FORM_EMPTY_CONTENT }} 至
    {{ displayedOfEnd || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { date, type Dater } from '@cat-kit/core'
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { Calendar, Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type { DateRangePickerEmits, DateRangePickerProps, DropdownExposed } from '../../types'
import { UDatePanel } from '../date-panel'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'

defineOptions({ name: 'UDateRangePicker' })

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
  return [cls.b, cls.m(size.value), bem.is('disabled', disabled.value)]
})

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const dropdownRef = shallowRef<DropdownExposed>()

const { userAction, isUserActive } = useUserAction()

const currentRangeDate = shallowRef<[Dater, Dater]>()

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

watch(
  () => props.modelValue,
  (val) => {
    if (isUserActive()) return
    if (val?.length === 2) {
      currentRangeDate.value = [date(val[0]), date(val[1])]
    } else {
      currentRangeDate.value = undefined
    }
  },
  { immediate: true }
)

const commitSelectedRange = userAction((rangeDate: [Dater, Dater] | undefined) => {
  currentRangeDate.value = rangeDate
  emit('update:modelValue', rangeDate?.map((d) => d.format(formatStr.value)) as [string, string])
})

async function handleSelect(rangeDate: [Dater, Dater] | undefined) {
  await commitSelectedRange(rangeDate)
  dropdownRef.value?.close()
}

const hovered = shallowRef(false)

function handleClear() {
  currentRangeDate.value = undefined
  emit('update:modelValue', undefined)
}
</script>
