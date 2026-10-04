<template>
  <!-- 只读态：纯展示 -->
  <template v-if="readonly">{{ displayedValue || FORM_EMPTY_CONTENT }}</template>

  <div
    v-else
    v-bind="$attrs"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('active', sheetVisible)]"
    :aria-expanded="sheetVisible"
    aria-haspopup="dialog"
    @click="handleTriggerClick"
  >
    <span :class="[cls.e('value'), bem.is('placeholder', !displayedValue)]">
      {{ displayedValue || placeholder }}
    </span>

    <span :class="cls.e('icons')">
      <button
        v-if="showClear"
        :class="cls.e('clear')"
        type="button"
        aria-label="清除"
        @click.stop="handleClear"
      >
        <Close />
      </button>
      <span v-else :class="cls.e('icon')" aria-hidden="true">
        <Time />
      </span>
    </span>
  </div>

  <!-- 底部滚轮面板（复用 P6 弹层基座，内部实现不进公开导出）：取消/确定，滚动结果暂存至确认 -->
  <BottomSheet v-model:visible="sheetVisible">
    <template #header>
      <button :class="cls.e('cancel')" type="button" @click="sheetVisible = false">取消</button>
      <span :class="cls.e('title')">{{ placeholder }}</span>
      <button :class="cls.e('confirm')" type="button" @click="handleConfirm">确定</button>
    </template>

    <div :class="cls.e('wheel')">
      <div
        v-for="col of columns"
        :key="col.name"
        :ref="setColumnRef(col.name)"
        :class="cls.e('column')"
        role="listbox"
        :aria-label="unitLabels[col.name]"
        @scroll.passive="handleScroll(col.name)"
      >
        <div :class="cls.e('spacer')" aria-hidden="true"></div>
        <div
          v-for="item of col.values"
          :key="item.value"
          :class="[
            cls.e('item'),
            bem.is('selected', staged[col.name] === item.value),
            bem.is('disabled', item.disabled)
          ]"
          role="option"
          :aria-selected="staged[col.name] === item.value"
          @click="handleSelect(col.name, item)"
        >
          {{ pad(item.value) }}
        </div>
        <div :class="cls.e('spacer')" aria-hidden="true"></div>
      </div>
      <div :class="cls.e('highlight')" aria-hidden="true"></div>
    </div>
  </BottomSheet>
</template>

<script lang="ts" setup>
import { date, Dater } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { Close, Time } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'

import type { TimePickerEmits, TimePickerProps } from '../../types/time-picker'
import { BottomSheet } from '../_internal/bottom-sheet'

defineOptions({ name: 'UTimePicker', inheritAttrs: false })

const props = withDefaults(defineProps<TimePickerProps>(), {
  placeholder: '选择时间',
  dataType: 'string',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<TimePickerEmits>()

const cls = bem('time-picker')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const formatStr = computed(() => props.format ?? 'HH:mm:ss')

const currentTime = shallowRef<Dater>()

const sheetVisible = shallowRef(false)

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
    currentTime.value = parseModelValue(modelValue)
  },
  { immediate: true }
)

const displayedValue = computed(() => currentTime.value?.format(formatStr.value) ?? '')

/** 移动端无 hover：有值且可清除即展示清除按钮 */
const showClear = computed(() => props.clearable && !disabled.value && !!displayedValue.value)

function formatModelValue(d: Dater) {
  if (props.dataType === 'date') return d.raw
  if (props.dataType === 'timestamp') return d.timestamp
  return d.format(props.valueFormat ?? formatStr.value)
}

type TimeUnit = 'hours' | 'minutes' | 'seconds'

interface TimeItem {
  value: number
  disabled: boolean
}

const unitLabels: Record<TimeUnit, string> = { hours: '时', minutes: '分', seconds: '秒' }

/** 滚轮行高（CSS px），列高固定 5 行 */
const ITEM_HEIGHT = 44

/** 面板打开期间的暂存时间：确定时落盘，取消时丢弃 */
const staged = shallowRef<Record<TimeUnit, number>>({ hours: 0, minutes: 0, seconds: 0 })

function buildValues(count: number, disabled: Set<number>): TimeItem[] {
  return Array.from({ length: count }, (_, value) => ({ value, disabled: disabled.has(value) }))
}

const columns = computed(() => {
  const { hours, minutes } = staged.value
  const disabledHours = new Set(props.disabledHours?.() ?? [])
  const disabledMinutes = new Set(props.disabledMinutes?.(hours) ?? [])
  const disabledSeconds = new Set(props.disabledSeconds?.(hours, minutes) ?? [])

  return [
    { name: 'hours' as const, values: buildValues(24, disabledHours) },
    { name: 'minutes' as const, values: buildValues(60, disabledMinutes) },
    { name: 'seconds' as const, values: buildValues(60, disabledSeconds) }
  ]
})

const columnEls = new Map<TimeUnit, HTMLElement>()

/** v-for 函数 ref：按列名登记滚轮列元素 */
function setColumnRef(name: TimeUnit) {
  return (el: unknown) => {
    if (el instanceof HTMLElement) columnEls.set(name, el)
    else columnEls.delete(name)
  }
}

/** 行索引即滚动位置 / 行高（上下补位等高，首行居中时 scrollTop 为 0） */
function scrollToValue(name: TimeUnit, value: number, smooth = false) {
  columnEls.get(name)?.scrollTo({ top: value * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' })
}

const SCROLL_SETTLE_DELAY = 100

const scrollTimers = new Map<TimeUnit, ReturnType<typeof setTimeout>>()

onBeforeUnmount(() => {
  for (const timer of scrollTimers.values()) clearTimeout(timer)
})

/** 滚动停稳后把视口中心的值落为暂存；停在禁用项则回弹到当前暂存值 */
function handleScroll(name: TimeUnit) {
  clearTimeout(scrollTimers.get(name))
  scrollTimers.set(
    name,
    setTimeout(() => {
      const el = columnEls.get(name)
      if (!el) return
      const values = columns.value.find((col) => col.name === name)!.values
      const item = values[Math.round(el.scrollTop / ITEM_HEIGHT)]
      if (!item || item.disabled) {
        scrollToValue(name, staged.value[name], true)
        return
      }
      staged.value = { ...staged.value, [name]: item.value }
    }, SCROLL_SETTLE_DELAY)
  )
}

/** 点击选项：落暂存并平滑滚动到中心 */
function handleSelect(name: TimeUnit, item: TimeItem) {
  if (item.disabled) return
  staged.value = { ...staged.value, [name]: item.value }
  scrollToValue(name, item.value, true)
}

// 面板展开时以当前值定位各滚轮（无值则 00:00:00，与 desktop 基底行为一致）
watch(sheetVisible, (visible) => {
  if (!visible) return
  const t = currentTime.value
  staged.value = t
    ? { hours: t.hours, minutes: t.minutes, seconds: t.seconds }
    : { hours: 0, minutes: 0, seconds: 0 }
  nextTick(() => {
    for (const col of columns.value) scrollToValue(col.name, staged.value[col.name])
  })
})

const pad = (value: number) => `${value}`.padStart(2, '0')

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

/** 确定：暂存落盘并通知父级（无值时以今天 00:00:00 为基底，与 desktop 一致） */
function handleConfirm() {
  const base = currentTime.value ?? date().setHours(0).setMinutes(0).setSeconds(0)
  const next = base
    .clone()
    .setHours(staged.value.hours)
    .setMinutes(staged.value.minutes)
    .setSeconds(staged.value.seconds)

  currentTime.value = next
  emit('update:modelValue', formatModelValue(next))
  emit('change', next.raw)
  sheetVisible.value = false
}

function handleClear() {
  currentTime.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}
</script>
