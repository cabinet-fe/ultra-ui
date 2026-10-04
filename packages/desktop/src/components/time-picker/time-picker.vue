<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    :class="className"
    trigger="click"
    width="auto"
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
          <u-icon :class="cls.e('icon')"><Time /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <div :ref="scrollSelectedToCenter" :class="[cls.e('panel'), cls.em('panel', size)]">
        <div v-for="col in columns" :key="col.name" :class="cls.e('column')">
          <div :class="cls.e('spacer')" aria-hidden="true"></div>
          <div
            v-for="item in col.values"
            :key="item.value"
            :class="[
              cls.e('item'),
              bem.is('selected', col.selected === item.value),
              bem.is('disabled', item.disabled)
            ]"
            @click="handleSelect(col.name, item)"
          >
            {{ pad(item.value) }}
          </div>
          <div :class="cls.e('spacer')" aria-hidden="true"></div>
        </div>
      </div>
    </template>
  </u-dropdown>

  <template v-else>
    {{ displayedValue || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { date, Dater } from '@cat-kit/core'
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { Time } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, watch } from 'vue'

import type { TimePickerEmits, TimePickerProps } from '../../types'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'
import { UInput } from '../input'

defineOptions({ name: 'TimePicker', inheritAttrs: false })

const props = defineProps<TimePickerProps>()

const emit = defineEmits<TimePickerEmits>()

const cls = bem('time-picker')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const className = computed(() => [cls.b, cls.m(size.value)])

const placeholder = computed(() => props.placeholder ?? '选择时间')

const clearable = computed(() => props.clearable ?? true)

const formatStr = computed(() => props.format ?? 'HH:mm:ss')

const currentTime = shallowRef<Dater>()

const { userAction, isUserActive } = useUserAction()

function parseModelValue(val?: string | number | Date): Dater | undefined {
  if (val == null || val === '') return undefined
  if (val instanceof Date || typeof val === 'number') {
    const d = date(val)
    return isNaN(d.timestamp) ? undefined : d
  }
  const parsed = Dater.parse(val, props.valueFormat ?? formatStr.value)
  if (!isNaN(parsed.timestamp)) return parsed
  const fallback = date(val)
  return isNaN(fallback.timestamp) ? undefined : fallback
}

watch(
  () => props.modelValue,
  (modelValue) => {
    if (isUserActive()) return
    currentTime.value = parseModelValue(modelValue)
  },
  { immediate: true }
)

const displayedValue = computed(() => currentTime.value?.format(formatStr.value) ?? '')

type TimeUnit = 'hours' | 'minutes' | 'seconds'

interface TimeItem {
  value: number
  disabled: boolean
}

const columns = computed(() => {
  const t = currentTime.value
  const disabledHours = new Set(props.disabledHours?.() ?? [])
  const disabledMinutes = new Set(props.disabledMinutes?.(t?.hours ?? 0) ?? [])
  const disabledSeconds = new Set(props.disabledSeconds?.(t?.hours ?? 0, t?.minutes ?? 0) ?? [])

  return [
    { name: 'hours' as const, selected: t?.hours, values: buildValues(24, disabledHours) },
    { name: 'minutes' as const, selected: t?.minutes, values: buildValues(60, disabledMinutes) },
    { name: 'seconds' as const, selected: t?.seconds, values: buildValues(60, disabledSeconds) }
  ]
})

function buildValues(count: number, disabled: Set<number>): TimeItem[] {
  return Array.from({ length: count }, (_, value) => ({ value, disabled: disabled.has(value) }))
}

const pad = (value: number) => `${value}`.padStart(2, '0')

function formatModelValue(d: Dater) {
  if (props.dataType === 'date') return d.raw
  if (props.dataType === 'timestamp') return d.timestamp
  return d.format(props.valueFormat ?? formatStr.value)
}

const commitSelectedTime = userAction((time: Dater) => {
  currentTime.value = time
  emit('update:modelValue', formatModelValue(time))
  emit('change', time.raw)
})

function handleSelect(unit: TimeUnit, item: TimeItem) {
  if (item.disabled) return
  // 无初值时以当天 00:00:00 为基底，只改点击的维度，未选维度保持 0
  const next = (currentTime.value ?? date().setHours(0).setMinutes(0).setSeconds(0)).clone()
  if (unit === 'hours') next.setHours(item.value)
  else if (unit === 'minutes') next.setMinutes(item.value)
  else next.setSeconds(item.value)
  commitSelectedTime(next)
}

function handleClear() {
  currentTime.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 函数 ref：面板经 Teleport 挂载时元素先创建、后插入文档（ref 回调时还未连接），推迟到 nextTick 再把各列滚动到选中值居中 */
function scrollSelectedToCenter(panel: Element | null) {
  if (!(panel instanceof HTMLElement)) return
  nextTick(() => {
    if (!panel.isConnected) return
    for (const column of panel.querySelectorAll<HTMLElement>(`.${cls.e('column')}`)) {
      const selected = column.querySelector('.is-selected')
      if (selected instanceof HTMLElement) {
        column.scrollTop = selected.offsetTop - (column.clientHeight - selected.offsetHeight) / 2
      }
    }
  })
}
</script>
