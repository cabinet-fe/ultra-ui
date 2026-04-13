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
    :size="size"
    :readonly="readonly"
    :disabled="disabled"
  >
    <template #suffix v-if="step !== undefined && step !== false">
      <slot name="suffix" />
      <!-- capture + prevent：在默认失焦行为之前拦截，避免先 blur 再 click 时用旧 props 覆盖 model -->
      <div :class="cls.e('step')" @mousedown.capture.prevent>
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
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { vRipple } from '@ui/directives'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type { NumberInputEmits, NumberInputProps, InputExposed } from '@ui/types'
import { bem } from '@ui/utils'
import { ArrowUp, ArrowDown } from '@ultra/icon'
import { n, Tween, obj, isUndef } from 'cat-kit/fe'
import { computed, shallowRef, watch } from 'vue'

import { UIcon } from '../icon'
import { UInput } from '../input'

defineOptions({
  name: 'NumberInput'
})

const props = withDefaults(defineProps<NumberInputProps>(), {
  placeholder: '请输入',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})
const emit = defineEmits<NumberInputEmits>()

const slots = defineSlots<{
  prefix?: () => any
  suffix?: () => any
}>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const inputProps = computed(() => {
  return obj(props).pick(['clearable', 'disabled', 'placeholder', 'size', 'prefix', 'suffix'])
})

const inputRef = shallowRef<InputExposed>()

const inputDom = computed(() => inputRef.value?.el)

const cls = bem('number-input')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/** 实际值 */
const model = defineModel<NumberInputProps['modelValue']>()

/** 步进数字动画进行中，避免在动画未完成时重复步进绕过 min/max 等规则 */
const steppingTweening = shallowRef(false)

// 展示值
const displayed = shallowRef('')

const focused = shallowRef(false)

const generateDisplayed = computed(() => {
  if (!displayed.value) return ''

  return `${props.prefix ?? ''}${displayed.value}${props.suffix ?? ''}`
})

/** 步长 */
const stepVal = computed<number>(() => {
  const { step } = props
  if (step === undefined) return 1
  return typeof step === 'boolean' ? 1 : step
})

/** 是否可增 */
const increasable = computed(() => {
  const { max, multiple } = props
  if (isUndef(max) || isUndef(model.value)) return true
  // 如果存在倍数，先将 model.value 除以倍数得到原始值再比较
  const rawValue = multiple ? n.div(model.value, multiple) : model.value
  return rawValue < max
})

/** 是否可减 */
const reducible = computed(() => {
  const { min, multiple } = props
  if (isUndef(min) || isUndef(model.value)) return true
  // 如果存在倍数，先将 model.value 除以倍数得到原始值再比较
  const rawValue = multiple ? n.div(model.value, multiple) : model.value
  return rawValue > min
})

// 通过值和步长值计算默认的最大精度
const defaultMaxPrecision = computed(() => {
  const { multiple } = props
  // 如果存在倍数，基于原始值计算精度
  const rawValue =
    multiple && model.value !== undefined ? n.div(model.value, multiple) : model.value
  return Math.max(
    String(rawValue).split('.')[1]?.length ?? 0,
    String(stepVal.value).split('.')[1]?.length ?? 0
  )
})

/**
 * 获取展示值
 * @param num 实际值
 */
function getDisplayed(num?: number): string {
  if (!num && num !== 0) return ''

  const {
    currency,
    precision,
    minPrecision,
    // 如果没有指定最大精度那么设置默认为值和步长值中的较大值
    maxPrecision = defaultMaxPrecision.value,
    multiple
  } = props

  // 如果存在倍数，先将实际值除以倍数得到原始值
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

watch(
  [model, focused, () => props.currency],
  ([model, focused]) => {
    if (focused) return
    displayed.value = getDisplayed(model)
  },
  { immediate: true }
)

/**
 * 解析展示值
 * @param str 展示值
 */
function parseDisplayed(str: string): number | undefined {
  if (!str) return undefined

  // 将货币格式去掉再转化为数字
  const number = +str.replace(/\,/g, '')
  const { multiple } = props

  // 如果解析失败，使用当前值作为回退
  // 如果存在倍数，需要先将 model.value 除以倍数得到原始值
  let result: number | undefined
  if (isNaN(number)) {
    if (model.value === undefined) return undefined
    result = multiple ? n.div(model.value, multiple) : model.value
  } else {
    result = number
  }

  if (result === undefined) return undefined

  const { precision, maxPrecision, minPrecision } = props

  const fixedResult = +n(result).fixed(
    precision ?? {
      minPrecision,
      maxPrecision
    }
  )

  // 如果存在倍数，将原始值乘以倍数返回实际值
  return multiple ? n.mul(fixedResult, multiple) : fixedResult
}

/**
 * 获取有效值
 * @param val 值
 */
function getValidValue<T extends undefined | number>(val: T): T {
  if (val === undefined) return val
  const { min, max, multiple } = props

  // 如果存在倍数，先将值除以倍数得到原始值进行验证，验证后再乘以倍数
  if (multiple) {
    const rawVal = n.div(val, multiple)
    let validRawVal = rawVal
    if (min !== undefined && rawVal < min) validRawVal = min
    if (max !== undefined && rawVal > max) validRawVal = max
    return n.mul(validRawVal, multiple) as T
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

/**
 * 处理输入值变化的函数, 该函数仅在输入框失去焦点时触发,
 * 主要用于在输入非数字的情况下的修正处理
 * @param input 输入的值
 */
function handleChange() {
  emit('change', model.value)
}

function syncStepInputDomFromModel(): void {
  const _rawInput = inputDom.value
  if (!_rawInput) return
  _rawInput.value = getDisplayed(model.value)
}

const tween = new Tween(
  { n: model.value ?? 0 },
  {
    onUpdate(state) {
      const _rawInput = inputDom.value
      if (!_rawInput) return
      const { multiple } = props
      // 如果存在倍数，tween.state.n 存储的是原始值，需要乘以倍数后传给 getDisplayed
      const actualValue = multiple ? n.mul(state.n, multiple) : state.n
      _rawInput.value = getDisplayed(actualValue)
    },
    // 动画进行的过程值有可能被改变, 因此在onComplete中确保还原的是原本的值
    onComplete() {
      steppingTweening.value = false
      syncStepInputDomFromModel()
    }
  }
)

/** 增 */
function increase(): void {
  if (disabled.value || steppingTweening.value || !increasable.value) return
  const { multiple } = props
  const val = model.value ?? 0

  if (multiple) {
    // 如果存在倍数，先将实际值除以倍数得到原始值
    const rawVal = n.div(val, multiple)
    // 在原始值基础上加步长
    const newRawVal = n.plus(rawVal, stepVal.value)
    // 乘以倍数得到新的实际值
    const newVal = n.mul(newRawVal, multiple)
    const target = getValidValue(newVal)
    model.value = target
    // tween 动画在原始值上进行：从当前 raw 播放到目标 raw（此前误设为终点导致状态与动画不一致）
    tween.state.n = rawVal
    steppingTweening.value = true
    tween.to({ n: n.div(target, multiple) })
  } else {
    tween.state.n = val
    const target = getValidValue(n.plus(val, stepVal.value))
    model.value = target
    steppingTweening.value = true
    tween.to({ n: target })
  }
  emit('change', model.value)
}

/** 减 */
function decrease(): void {
  if (disabled.value || steppingTweening.value || !reducible.value) return
  const { multiple } = props
  const val = model.value ?? 0

  if (multiple) {
    // 如果存在倍数，先将实际值除以倍数得到原始值
    const rawVal = n.div(val, multiple)
    // 在原始值基础上减步长
    const newRawVal = n.minus(rawVal, stepVal.value)
    // 乘以倍数得到新的实际值
    const newVal = n.mul(newRawVal, multiple)
    const target = getValidValue(newVal)
    model.value = target
    tween.state.n = rawVal
    steppingTweening.value = true
    tween.to({ n: n.div(target, multiple) })
  } else {
    tween.state.n = val
    const target = getValidValue(n.minus(val, stepVal.value))
    model.value = target
    steppingTweening.value = true
    tween.to({ n: target })
  }
  emit('change', model.value)
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
    // 如果存在倍数，先除以倍数得到原始值进行精度修正，再乘以倍数
    const rawVal = n.div(model.value, multiple)
    const fixedRawVal = +n(rawVal).fixed(
      precision ?? {
        maxPrecision,
        minPrecision
      }
    )
    model.value = n.mul(fixedRawVal, multiple)
  } else {
    model.value = +n(model.value).fixed(
      precision ?? {
        maxPrecision,
        minPrecision
      }
    )
  }
}

function handleBlur(): void {
  focused.value = false
  // 步进动画进行中勿用 props 回写，避免与 Tween/子组件提交不同步的旧 v-model 把值拉回边界内从而可再次步进「绕过」观感
  if (steppingTweening.value) return
  model.value = props.modelValue
}
</script>
