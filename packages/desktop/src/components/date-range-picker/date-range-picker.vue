<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    :class="className"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    width="auto"
    ref="dropdownRef"
    :disabled="disabled"
    @mouseenter.native="hovered = true"
    @mouseleave.native="hovered = false"
    @update:visible="dropdownVisible = $event"
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
          v-if="clearable && (modelValue?.length || currentRangeDate) && hovered && !disabled"
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
import { date, Dater } from '@cat-kit/core'
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { Calendar, Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type {
  DateRangePickerEmits,
  DateRangePickerProps,
  DateRangeValue,
  DropdownExposed
} from '../../types'
import { UDatePanel } from '../date-panel'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'

defineOptions({ name: 'UDateRangePicker', inheritAttrs: false })

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  placeholder: () => ['起始日期', '结束日期'],
  type: 'date',
  dataType: 'string',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<DateRangePickerEmits>()

const cls = bem('date-range-picker')

const dropdownVisible = shallowRef(false)

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('focus', dropdownVisible.value)
  ]
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

const formatStr = computed(() => {
  const { format, type } = props
  if (format) return format
  if (type === 'date') return 'yyyy-MM-dd'
  if (type === 'month') return 'yyyy-MM'
  if (type === 'year') return 'yyyy'
  return 'yyyy-MM-dd'
})

const displayedOfStart = computed(() => {
  return currentRangeDate.value?.[0]?.format(formatStr.value) ?? ''
})

const displayedOfEnd = computed(() => {
  return currentRangeDate.value?.[1]?.format(formatStr.value) ?? ''
})

function parseDateValue(val?: string | number | Date): Dater | undefined {
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
  (val) => {
    if (isUserActive()) return
    if (val && val.length === 2) {
      const d1 = parseDateValue(val[0])
      const d2 = parseDateValue(val[1])
      if (d1 && d2) {
        currentRangeDate.value = [d1, d2]
        return
      }
    }
    currentRangeDate.value = undefined
  },
  { immediate: true }
)

function formatDateValue(d: Dater) {
  if (props.dataType === 'date') {
    return d.raw
  }
  if (props.dataType === 'timestamp') {
    return d.timestamp
  }
  return d.format(props.valueFormat ?? formatStr.value)
}

function formatModelValue(range: [Dater, Dater]): DateRangeValue {
  return [formatDateValue(range[0]), formatDateValue(range[1])] as DateRangeValue
}

const commitSelectedRange = userAction((rangeDate: [Dater, Dater]) => {
  currentRangeDate.value = rangeDate
  emit('update:modelValue', formatModelValue(rangeDate))
  emit('change', [rangeDate[0].raw, rangeDate[1].raw])
})

async function handleSelect(rangeDate: [Dater, Dater] | undefined) {
  if (!rangeDate) return
  await commitSelectedRange(rangeDate)
  dropdownRef.value?.close()
}

const hovered = shallowRef(false)

function handleClear() {
  currentRangeDate.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}
</script>
