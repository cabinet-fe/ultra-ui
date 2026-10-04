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
        <Calendar />
      </span>
    </span>
  </div>

  <!-- 底部日历面板（复用 P6 弹层基座，内部实现不进公开导出） -->
  <BottomSheet v-model:visible="sheetVisible" :title="placeholder">
    <div :class="cls.e('panel')">
      <header :class="cls.e('panel-header')">
        <button
          :class="cls.e('nav')"
          type="button"
          :aria-label="`上一个${navUnit}`"
          @click="handlePrev"
        >
          <Left />
        </button>
        <span :class="cls.e('panel-title')">{{ panelTitle }}</span>
        <button
          :class="cls.e('nav')"
          type="button"
          :aria-label="`下一个${navUnit}`"
          @click="handleNext"
        >
          <Right />
        </button>
      </header>

      <template v-if="type === 'date'">
        <ul :class="cls.e('week')">
          <li v-for="weekDay of weekDays" :key="weekDay" :class="cls.e('week-day')">
            {{ weekDay }}
          </li>
        </ul>
        <ul :class="cls.e('days')">
          <li
            v-for="cell of dayCells"
            :key="cell.key"
            :class="[cls.e('cell'), bem.is(cell.type), cellClass(cell)]"
            role="gridcell"
            :aria-selected="isSelected(cell.date)"
            @click="handleSelect(cell)"
          >
            {{ cell.date.day }}
          </li>
        </ul>
      </template>

      <ul v-else-if="type === 'month'" :class="cls.e('months')">
        <li
          v-for="cell of monthCells"
          :key="cell.date.month"
          :class="[cls.e('cell'), cellClass(cell)]"
          role="gridcell"
          :aria-selected="isSelected(cell.date)"
          @click="handleSelect(cell)"
        >
          {{ cell.date.month }}月
        </li>
      </ul>

      <ul v-else :class="cls.e('years')">
        <li
          v-for="cell of yearCells"
          :key="cell.date.year"
          :class="[cls.e('cell'), cellClass(cell)]"
          role="gridcell"
          :aria-selected="isSelected(cell.date)"
          @click="handleSelect(cell)"
        >
          {{ cell.date.year }}
        </li>
      </ul>
    </div>
  </BottomSheet>
</template>

<script lang="ts" setup>
import { date, Dater } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { Calendar, Close, Left, Right } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type { DatePickerEmits, DatePickerProps } from '../../types/date-picker'
import { BottomSheet } from '../_internal/bottom-sheet'

defineOptions({ name: 'UDatePicker', inheritAttrs: false })

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期',
  type: 'date',
  dataType: 'string',
  disabled: undefined,
  readonly: undefined,
  clearable: true
})

const emit = defineEmits<DatePickerEmits>()

const cls = bem('date-picker')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const formats = { date: 'yyyy-MM-dd', month: 'yyyy-MM', year: 'yyyy' } as const

/** 选中格式串：显示与字符串值共用的模板 */
const formatStr = computed(() => props.format ?? formats[props.type ?? 'date'])

const currentDate = shallowRef<Dater>()

const sheetVisible = shallowRef(false)

/** 面板浏览中的年月（与选中值解耦，翻页不改动选中） */
const panelDate = shallowRef(date())

function parseModelValue(val?: string | number | Date): Dater | undefined {
  if (val == null || val === '') return undefined
  if (val instanceof Date || typeof val === 'number') {
    const d = date(val)
    return isNaN(d.timestamp) ? undefined : d
  }
  if (props.dataType === 'string' && props.valueFormat) {
    const parsed = Dater.parse(val, props.valueFormat)
    if (!isNaN(parsed.timestamp)) return parsed
  }
  const fallback = date(val)
  return isNaN(fallback.timestamp) ? undefined : fallback
}

watch(
  () => props.modelValue,
  (modelValue) => {
    currentDate.value = parseModelValue(modelValue)
  },
  { immediate: true }
)

// 面板展开时以选中值（无则今天）定位浏览年月
watch(sheetVisible, (visible) => {
  if (!visible) return
  panelDate.value = date(currentDate.value?.timestamp ?? Date.now())
})

const displayedValue = computed(() => currentDate.value?.format(formatStr.value) ?? '')

/** 移动端无 hover：有值且可清除即展示清除按钮 */
const showClear = computed(() => props.clearable && !disabled.value && !!displayedValue.value)

function formatModelValue(d: Dater) {
  if (props.dataType === 'date') return d.raw
  if (props.dataType === 'timestamp') return d.timestamp
  return d.format(props.valueFormat ?? formatStr.value)
}

/** 选中比对串（按 type 粒度：日比到日、月比到月、年比到年） */
const compareFmt = computed(
  () => ({ date: 'yyyyMMdd', month: 'yyyyMM', year: 'yyyy' })[props.type ?? 'date']
)

function isSelected(d: Dater) {
  return (
    !!currentDate.value && d.format(compareFmt.value) === currentDate.value.format(compareFmt.value)
  )
}

const navUnit = computed(() => ({ date: '月', month: '年', year: '十年' })[props.type ?? 'date'])

const panelTitle = computed(() => {
  const p = panelDate.value
  if (props.type === 'date') return `${p.year}年${p.month}月`
  if (props.type === 'month') return `${p.year}年`
  const start = p.year - (p.year % 10)
  return `${start} - ${start + 9}`
})

function handlePrev() {
  shiftPanel(-1)
}

function handleNext() {
  shiftPanel(1)
}

/** 翻页步长随 type 变化：日视图按月、月视图按年、年视图按十年 */
function shiftPanel(step: number) {
  const { type } = props
  if (type === 'date') {
    panelDate.value = panelDate.value.calc(step, 'months')
  } else if (type === 'year') {
    panelDate.value = panelDate.value.calc(step * 10, 'years')
  } else {
    panelDate.value = panelDate.value.calc(step, 'years')
  }
}

interface Cell {
  key: string
  date: Dater
  type: 'pre' | 'current' | 'next'
  isToday: boolean
  disabled?: boolean
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

/** 与 desktop 日历一致：固定 6 行 42 格，含上月尾与下月头补位 */
const dayCells = computed<Cell[]>(() => {
  const first = date(panelDate.value.timestamp).setDay(1)
  const todayStr = date().format()

  const cells: Cell[] = []
  const toCell = (d: Dater, type: Cell['type']): Cell => ({
    key: `${type}-${d.timestamp}`,
    date: d,
    type,
    isToday: d.format() === todayStr,
    disabled: props.disabledDate?.(d, d.raw)
  })

  for (let i = 0; i < first.weekDay; i++)
    cells.push(toCell(first.calc(i - first.weekDay, 'days'), 'pre'))
  for (let i = 0; i < first.getDays(); i++) cells.push(toCell(first.calc(i, 'days'), 'current'))
  for (let i = 0; cells.length < 42; i++)
    cells.push(toCell(first.calc(first.getDays() + i, 'days'), 'next'))

  return cells
})

/** 月格：以月末 23:59:59 参与 disabledDate 判定（与 desktop 一致） */
const monthCells = computed(() => {
  const year = panelDate.value.year
  return Array.from({ length: 12 }, (_, i) => {
    const d = date(`${year}-${i + 1}`)
      .toEndOfMonth()
      .setHours(23)
      .setMinutes(59)
      .setSeconds(59)
    return { key: `${year}-${i + 1}`, date: d, disabled: props.disabledDate?.(d, d.raw) }
  })
})

/** 年格：十年一页，以年末 23:59:59 参与 disabledDate 判定（与 desktop 一致） */
const yearCells = computed(() => {
  const start = panelDate.value.year - (panelDate.value.year % 10)
  return Array.from({ length: 10 }, (_, i) => {
    const d = date(`${start + i}-12-31 23:59:59`)
    return { key: `${start + i}`, date: d, disabled: props.disabledDate?.(d, d.raw) }
  })
})

type AnyCell = Cell | { key: string; date: Dater; disabled?: boolean }

function cellClass(cell: AnyCell) {
  return [
    bem.is('today', 'isToday' in cell && cell.isToday),
    bem.is('selected', isSelected(cell.date)),
    bem.is('disabled', !!cell.disabled)
  ]
}

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

/** 选中即落值并收起（与 desktop 选中关闭一致） */
function handleSelect(cell: AnyCell) {
  if (cell.disabled) return
  currentDate.value = date(cell.date.timestamp)
  emit('update:modelValue', formatModelValue(cell.date))
  emit('change', cell.date.raw)
  sheetVisible.value = false
}

function handleClear() {
  currentDate.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}
</script>
