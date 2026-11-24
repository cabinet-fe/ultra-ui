<template>
  <u-input
    v-if="!readonly"
    ref="inputRef"
    :class="className"
    :model-value="displayed"
    v-bind="inputProps"
    @update:model-value="handleUpdateModelValue"
    @change="handleChange"
    @keydown.stop="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    :size="size"
    :readonly="readonly"
    :disabled="disabled"
    :clearable="false"
  >
    <template #suffix v-if="hasSuffix">
      <span :class="cls.e('suffix')">
        <u-icon
          v-if="props.clearable"
          :class="[cls.e('clear'), bem.is('hidden', !showClear)]"
          :title="showClear ? '清除' : undefined"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
        <span v-if="hasCustomSuffix" :class="cls.e('suffix-content')">
          {{ suffix }}
          <slot name="suffix" />
        </span>
      </span>

      <div v-if="showStep" :class="cls.e('step')">
        <u-icon
          @click="increase"
          v-ripple="!disabled && increasable"
          :class="bem.is('disabled', disabled || !increasable)"
        >
          <ArrowUp />
        </u-icon>
        <u-icon
          @click="decrease"
          v-ripple="!disabled && reducible"
          :class="bem.is('disabled', disabled || !reducible)"
        >
          <ArrowDown />
        </u-icon>
      </div>
    </template>

    <template #prefix v-if="slots.prefix">
      <slot name="prefix" />
    </template>
  </u-input>

  <template v-else>
    {{ generateDisplayed || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import './style'
import { $n, n, o, isUndef } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { vRipple } from '@veltra/directives'
import { ArrowDown, ArrowUp, Close } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, Tween } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, shallowRef, useAttrs, watch } from 'vue'

import type { NumberInputEmits, NumberInputProps, InputExposed } from '../../types'
import { UIcon } from '../icon'
import { UInput } from '../input'

defineOptions({ name: 'UNumberInput', inheritAttrs: false })

const props = withDefaults(defineProps<NumberInputProps>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})
const emit = defineEmits<NumberInputEmits>()

const slots = defineSlots<{ prefix?: () => any; suffix?: () => any }>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const attrs = useAttrs()

const inputProps = computed(() => ({
  ...attrs,
  ...o(props).pick(['disabled', 'placeholder', 'size', 'prefix'])
}))

const inputRef = shallowRef<InputExposed>()

const inputDom = computed(() => inputRef.value?.el)

const cls = bem('number-input')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const model = defineModel<NumberInputProps['modelValue']>()

const displayed = shallowRef('')

const focused = shallowRef(false)
const hovered = shallowRef(false)

const generateDisplayed = computed(() => {
  if (!displayed.value) return ''

  return `${props.prefix ?? ''}${displayed.value}${props.suffix ?? ''}`
})

const showStep = computed(() => props.step !== undefined && props.step !== false)

const hasCustomSuffix = computed(() => !!props.suffix || !!slots.suffix)

const hasSuffix = computed(() => props.clearable || hasCustomSuffix.value || showStep.value)

const showClear = computed(() => {
  return props.clearable && !disabled.value && displayed.value !== '' && hovered.value
})

const stepVal = computed<number>(() => {
  const { step } = props
  if (step === undefined) return 1
  return typeof step === 'boolean' ? 1 : step
})

const increasable = computed(() => {
  const { max, multiple } = props
  if (isUndef(max) || isUndef(model.value)) return true
  const rawValue = multiple ? $n.div(model.value, multiple) : model.value
  return rawValue < max
})

const reducible = computed(() => {
  const { min, multiple } = props
  if (isUndef(min) || isUndef(model.value)) return true
  const rawValue = multiple ? $n.div(model.value, multiple) : model.value
  return rawValue > min
})

const defaultMaxPrecision = computed(() => {
  const { multiple } = props
  const rawValue =
    multiple && model.value !== undefined ? $n.div(model.value, multiple) : model.value
  return Math.max(
    String(rawValue).split('.')[1]?.length ?? 0,
    String(stepVal.value).split('.')[1]?.length ?? 0
  )
})

function getDisplayed(num?: number): string {
  if (!num && num !== 0) return ''

  const {
    currency,
    precision,
    minPrecision,
    maxPrecision = defaultMaxPrecision.value,
    multiple
  } = props

  const displayValue = multiple ? $n.div(num, multiple) : num

  return currency
    ? n(displayValue).currency('CNY', { precision, minPrecision, maxPrecision })
    : n(displayValue).fixed(precision ?? { minPrecision, maxPrecision })
}

watch(
  [model, focused, () => props.currency],
  ([modelValue, inputFocused]) => {
    if (inputFocused) return
    displayed.value = getDisplayed(modelValue)
  },
  { immediate: true }
)

function parseDisplayed(str: string): number | undefined {
  if (!str) return undefined

  const number = +str.replace(/,/g, '')
  const { multiple } = props

  let result: number | undefined
  if (isNaN(number)) {
    if (model.value === undefined) return undefined
    result = multiple ? $n.div(model.value, multiple) : model.value
  } else {
    result = number
  }

  if (result === undefined) return undefined

  const { precision, maxPrecision, minPrecision } = props

  const fixedResult = +n(result).fixed(precision ?? { minPrecision, maxPrecision })

  return multiple ? $n.mul(fixedResult, multiple) : fixedResult
}

function getValidValue<T extends undefined | number>(val: T): T {
  if (val === undefined) return val
  const { min, max, multiple } = props

  if (multiple) {
    const rawVal = $n.div(val, multiple)
    let validRawVal = rawVal
    if (min !== undefined && rawVal < min) validRawVal = min
    if (max !== undefined && rawVal > max) validRawVal = max
    return $n.mul(validRawVal, multiple) as T
  }

  if (min !== undefined && val < min) return min as T
  if (max !== undefined && val > max) return max as T
  return val
}

function handleUpdateModelValue(input: string): void {
  const newVal = parseDisplayed(input)
  model.value = getValidValue(newVal)
  displayed.value = input
}

function handleClear(): void {
  if (!showClear.value) return
  model.value = undefined
  displayed.value = ''
  emit('clear')
}

function handleChange() {
  emit('change', model.value)
}

const tween = new Tween(
  { n: model.value ?? 0 },
  {
    onUpdate(state) {
      const _rawInput = inputDom.value
      if (!_rawInput) return
      const { multiple } = props
      // 如果存在倍数，tween.state.n 存储的是原始值，需要乘以倍数后传给 getDisplayed
      const actualValue = multiple ? $n.mul(state.n, multiple) : state.n
      _rawInput.value = getDisplayed(actualValue)
    },
    // 动画进行的过程值有可能被改变, 因此在onComplete中确保还原的是原本的值
    onComplete() {
      const _rawInput = inputDom.value
      if (!_rawInput) return
      _rawInput.value = getDisplayed(model.value)
    }
  }
)

/**
 * 步进后更新输入框的展示值
 * 步长为 1 时直接展示目标值, 不播放数字滚动动画
 * @param rawFrom 步进前的原始值（存在倍数时为除以倍数后的值）
 * @param rawTarget 步进后的原始值（存在倍数时为除以倍数后的值）
 */
function updateStepDisplay(rawFrom: number, rawTarget: number): void {
  tween.state.n = rawFrom

  if (stepVal.value === 1) {
    tween.state.n = rawTarget
    const _rawInput = inputDom.value
    if (!_rawInput) return
    const { multiple } = props
    _rawInput.value = getDisplayed(multiple ? $n.mul(rawTarget, multiple) : rawTarget)
    return
  }

  tween.to({ n: rawTarget })
}

function increase(): void {
  if (disabled.value) return
  const { multiple } = props
  const val = model.value ?? 0

  if (multiple) {
    const rawVal = $n.div(val, multiple)
    const newRawVal = $n.plus(rawVal, stepVal.value)
    const target = getValidValue($n.mul(newRawVal, multiple))
    model.value = target
    updateStepDisplay($n.div(val, multiple), $n.div(target, multiple))
  } else {
    const target = getValidValue($n.plus(val, stepVal.value))
    model.value = target
    updateStepDisplay(val, target)
  }
}

function decrease(): void {
  if (disabled.value) return
  const { multiple } = props
  const val = model.value ?? 0

  if (multiple) {
    const rawVal = $n.div(val, multiple)
    const newRawVal = $n.minus(rawVal, stepVal.value)
    const target = getValidValue($n.mul(newRawVal, multiple))
    model.value = target
    updateStepDisplay($n.div(val, multiple), $n.div(target, multiple))
  } else {
    const target = getValidValue($n.minus(val, stepVal.value))
    model.value = target
    updateStepDisplay(val, target)
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (!props.step) return
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    return increase()
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    return decrease()
  }
}

function handleFocus(): void {
  focused.value = true

  // 如果初始值和当前设置的精度不匹配则进行精度修正
  if (model.value === undefined) return
  const { precision, maxPrecision, minPrecision, multiple } = props

  if (multiple) {
    const rawVal = $n.div(model.value, multiple)
    const fixedRawVal = +n(rawVal).fixed(precision ?? { maxPrecision, minPrecision })
    model.value = $n.mul(fixedRawVal, multiple)
  } else {
    model.value = +n(model.value).fixed(precision ?? { maxPrecision, minPrecision })
  }
}

function handleBlur(): void {
  focused.value = false
  model.value = props.modelValue
}

function handleMouseEnter(): void {
  hovered.value = true
}

function handleMouseLeave(): void {
  hovered.value = false
}
</script>
