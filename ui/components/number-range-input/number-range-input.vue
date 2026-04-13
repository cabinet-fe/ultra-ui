<template>
  <div v-if="!readonly" :class="className" @focusout="handleRangeFocusOut">
    <u-number-input
      v-model="startModel"
      :placeholder="startPlaceholder"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      v-bind="numberInputBind"
      @change="handleSideChange"
    />
    <span :class="cls.e('separator')">{{ separator }}</span>
    <u-number-input
      v-model="endModel"
      :placeholder="endPlaceholder"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      v-bind="numberInputBind"
      @change="handleSideChange"
    />
  </div>

  <template v-else>
    {{ readonlyText || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { NumberRangeInputEmits, NumberRangeInputProps, NumberRangeTuple } from '@ui/types'
import { bem } from '@ui/utils'
import { n, obj } from 'cat-kit/fe'
import { computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'

import { UNumberInput } from '../number-input'

defineOptions({
  name: 'NumberRangeInput'
})

const props = withDefaults(defineProps<NumberRangeInputProps>(), {
  startPlaceholder: '请输入',
  endPlaceholder: '请输入',
  separator: '~',
  clearable: true,
  autoPair: false,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<NumberRangeInputEmits>()

const inst = getCurrentInstance()

function splitBound(): boolean {
  const p = inst?.vnode.props
  if (!p) return false
  return 'start' in p || 'onUpdate:start' in p || 'end' in p || 'onUpdate:end' in p
}

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('number-range-input')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const model = defineModel<NumberRangeTuple>({
  default: () => [undefined, undefined]
})

const startRef = defineModel<number | undefined>('start')
const endRef = defineModel<number | undefined>('end')

let syncGuard = false

function normalizeFromSplit(s: number | undefined, e: number | undefined): NumberRangeTuple {
  let nextS = s
  let nextE = e
  if (nextS !== undefined && nextE !== undefined && nextS > nextE) nextE = nextS
  return [nextS, nextE]
}

watch(
  model,
  (t) => {
    if (syncGuard) return
    syncGuard = true
    const tuple = t ?? [undefined, undefined]
    if (startRef.value !== tuple[0]) startRef.value = tuple[0]
    if (endRef.value !== tuple[1]) endRef.value = tuple[1]
    nextTick(() => {
      syncGuard = false
    })
  },
  { deep: true }
)

watch(
  [startRef, endRef],
  () => {
    if (!splitBound() || syncGuard) return
    syncGuard = true
    const next: NumberRangeTuple = [startRef.value, endRef.value]
    const cur = model.value ?? [undefined, undefined]
    if (cur[0] !== next[0] || cur[1] !== next[1]) {
      model.value = next
    }
    nextTick(() => {
      syncGuard = false
    })
  },
  { deep: true }
)

onMounted(() => {
  if (!splitBound()) return
  const cur = model.value ?? [undefined, undefined]
  const hasModel = cur[0] !== undefined || cur[1] !== undefined
  if (hasModel) return
  const normalized = normalizeFromSplit(startRef.value, endRef.value)
  if (cur[0] !== normalized[0] || cur[1] !== normalized[1]) {
    syncGuard = true
    model.value = normalized
    nextTick(() => {
      syncGuard = false
    })
  }
})

const numberInputBind = computed(() => {
  return obj(props).pick([
    'clearable',
    'prefix',
    'suffix',
    'step',
    'min',
    'max',
    'currency',
    'precision',
    'minPrecision',
    'maxPrecision',
    'multiple'
  ])
})

const startModel = computed({
  get(): number | undefined {
    return model.value?.[0]
  },
  set(v: number | undefined) {
    const cur = model.value ?? [undefined, undefined]
    model.value = [v, cur[1]]
  }
})

const endModel = computed({
  get(): number | undefined {
    return model.value?.[1]
  },
  set(v: number | undefined) {
    const cur = model.value ?? [undefined, undefined]
    model.value = [cur[0], v]
  }
})

function formatNumberPart(num: number): string {
  const { currency, precision, minPrecision, maxPrecision, multiple } = props

  const displayValue = multiple ? n.div(num, multiple) : num

  return currency
    ? n(displayValue).currency('CNY', {
        precision,
        minPrecision,
        maxPrecision
      })
    : n(displayValue).fixed(
        precision ?? {
          minPrecision,
          maxPrecision
        }
      )
}

const readonlyText = computed(() => {
  const [s, e] = model.value ?? [undefined, undefined]
  if (s === undefined && e === undefined) return ''
  const p = props.prefix ?? ''
  const sfx = props.suffix ?? ''
  const sep = props.separator ?? '~'
  const a = s === undefined ? '—' : formatNumberPart(s)
  const b = e === undefined ? '—' : formatNumberPart(e)
  return `${p}${a} ${sep} ${b}${sfx}`
})

function emitChange(): void {
  emit('change', model.value ?? [undefined, undefined])
}

/** 单侧 `change`（含步进器）：先归一化区间顺序再向外派发，避免仅失焦才修正时步进可绕过规则。 */
function handleSideChange(): void {
  applyNormalizeRangeOrderOnBlur()
  emitChange()
}

/** @returns 是否写入了 `model` */
function applySyncPartialPairOnBlur(): boolean {
  if (!props.autoPair || disabled.value || readonly.value) return false
  const cur = model.value ?? [undefined, undefined]
  const s = cur[0]
  const e = cur[1]
  const sOk = s !== undefined
  const eOk = e !== undefined
  if (sOk === eOk) return false
  const fill = (sOk ? s : e) as number
  const normalized = normalizeFromSplit(fill, fill)
  if (cur[0] === normalized[0] && cur[1] === normalized[1]) return false
  model.value = normalized
  return true
}

/** 焦点离开整个控件后：两侧均有值且起始大于结束时，将结束抬到起始（与历史 normalize 一致）。 */
function applyNormalizeRangeOrderOnBlur(): boolean {
  if (disabled.value || readonly.value) return false
  const cur = model.value ?? [undefined, undefined]
  const normalized = normalizeFromSplit(cur[0], cur[1])
  if (cur[0] === normalized[0] && cur[1] === normalized[1]) return false
  model.value = normalized
  return true
}

function handleRangeFocusOut(e: FocusEvent): void {
  const root = e.currentTarget as HTMLElement
  const related = e.relatedTarget as Node | null
  if (related && root.contains(related)) return
  const changed = applySyncPartialPairOnBlur() || applyNormalizeRangeOrderOnBlur()
  if (changed) emitChange()
}
</script>
