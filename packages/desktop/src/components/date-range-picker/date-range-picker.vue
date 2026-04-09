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
import { FORM_EMPTY_CONTENT } from '@ultra-ui/utils'
import type {
  DateRangePickerEmits,
  DateRangePickerProps,
  DropdownExposed
} from '../../types'
import { bem } from '@ultra-ui/utils'
import { computed, shallowRef, watch } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import { UDatePanel } from '../date-panel'
import { date, type Dater } from '@cat-kit/core'
import { UDropdown } from '../dropdown'
import { useUpdateLock } from '@ultra-ui/compositions'
import { Calendar, Close } from '@ultra-ui/icons/normal'
import { UIcon } from '../icon'

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
  return [cls.b, cls.m(size.value), bem.is('disabled', disabled.value)]
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

const { update, updateAndLock } = useUpdateLock()

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
  val => {
    update(() => {
      if (val?.length === 2) {
        currentRangeDate.value = [date(val[0]), date(val[1])]
      }
    })
  },
  { immediate: true }
)

async function handleSelect(rangeDate: [Dater, Dater] | undefined) {
  await updateAndLock(() => {
    currentRangeDate.value = rangeDate
    emit(
      'update:modelValue',
      rangeDate?.map(d => d.format(formatStr.value)) as [string, string]
    )
  })
  dropdownRef.value?.close()
}

const hovered = shallowRef(false)

function handleClear() {
  currentRangeDate.value = undefined
  emit('update:modelValue', undefined)
}
</script>
