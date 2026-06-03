<template>
  <div v-if="!readonly" :class="className">
    <u-number-input
      v-model="startModel"
      :placeholder="startPlaceholder"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      v-bind="numberInputBind"
      @change="emitChange"
    />
    <span :class="cls.e('separator')">{{ separator }}</span>
    <u-number-input
      v-model="endModel"
      :placeholder="endPlaceholder"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      v-bind="numberInputBind"
      @change="emitChange"
    />
  </div>

  <template v-else>
    {{ readonlyText || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { n, $n, o } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'

import type { NumberRangeInputEmits, NumberRangeInputProps, NumberRangeTuple } from '../../types'
import { UNumberInput } from '../number-input'

defineOptions({ name: 'NumberRangeInput' })

const props = withDefaults(defineProps<NumberRangeInputProps>(), {
  startPlaceholder: '请输入',
  endPlaceholder: '请输入',
  separator: '~',
  clearable: true,
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

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('number-range-input')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const model = defineModel<NumberRangeTuple>({ default: () => [undefined, undefined] })

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
    const normalized = normalizeFromSplit(startRef.value, endRef.value)
    const cur = model.value ?? [undefined, undefined]
    if (cur[0] !== normalized[0] || cur[1] !== normalized[1]) {
      model.value = normalized
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
  return o(props).pick([
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
    const end = cur[1]
    let nextEnd = end
    if (v !== undefined && end !== undefined && v > end) nextEnd = v
    model.value = [v, nextEnd]
  }
})

const endModel = computed({
  get(): number | undefined {
    return model.value?.[1]
  },
  set(v: number | undefined) {
    const cur = model.value ?? [undefined, undefined]
    const start = cur[0]
    let nextStart = start
    if (v !== undefined && start !== undefined && v < start) nextStart = v
    model.value = [nextStart, v]
  }
})

function formatNumberPart(num: number): string {
  const { currency, precision, minPrecision, maxPrecision, multiple } = props

  const displayValue = multiple ? $n.div(num, multiple) : num

  return currency
    ? n(displayValue).currency('CNY', { precision, minPrecision, maxPrecision })
    : n(displayValue).fixed(precision ?? { minPrecision, maxPrecision })
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
</script>
