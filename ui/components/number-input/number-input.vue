<template>
  <u-input
    v-if="readonly"
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
      <div :class="cls.e('step')">
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
  </u-input>

  <span v-else>
    {{ displayed }}
  </span>
</template>

<script lang="ts" setup>
import type {
  NumberInputEmits,
  NumberInputProps
} from '@ui/types/components/number-input'
import type { InputExposed } from '../input'
import { UInput } from '../input'
import { computed, shallowRef, watch } from 'vue'
import { n, Tween, obj, isUndef } from 'cat-kit/fe'
import { ArrowUp, ArrowDown } from 'icon-ultra'
import { UIcon } from '../icon'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { vRipple } from '@ui/directives'

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

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const inputProps = computed(() => {
  return obj(props).pick(['clearable', 'disabled', 'placeholder', 'size'])
})

const inputRef = shallowRef<InputExposed>()

const inputDom = computed(() => inputRef.value?.el)

const cls = bem('number-input')

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/** 实际值 */
const model = defineModel<NumberInputProps['modelValue']>()

// 展示值
const displayed = shallowRef('')

const focused = shallowRef(false)

/** 步长 */
const stepVal = computed<number>(() => {
  const { step } = props
  if (step === undefined) return 1
  return typeof step === 'boolean' ? 1 : step
})

/** 是否可增 */
const increasable = computed(() => {
  const { max } = props
  if (isUndef(max) || isUndef(model.value)) return true
  return model.value < max
})

/** 是否可减 */
const reducible = computed(() => {
  const { min } = props
  if (isUndef(min) || isUndef(model.value)) return true
  return model.value > min
})

/**
 * 获取展示值
 * @param num 实际值
 */
function getDisplayed(num?: number): string {
  if (num === undefined) return ''

  const {
    currency,
    precision,
    minPrecision,
    // 如果没有指定最大精度那么设置默认为值和步长值中的较大值
    maxPrecision = Math.max(
      String(model.value).split('.')[1]?.length ?? 0,
      String(stepVal.value).split('.')[1]?.length ?? 0
    )
  } = props

  return currency
    ? n(num).currency('CNY', {
        precision,
        minPrecision,
        maxPrecision
      })
    : n(num).fixed(
        precision ?? {
          minPrecision,
          maxPrecision
        }
      )
}

watch(
  [model, focused],
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
  const result = isNaN(number) ? model.value : number
  if (result === undefined) return undefined

  const { precision, maxPrecision, minPrecision } = props

  return +n(result).fixed(
    precision ?? {
      minPrecision,
      maxPrecision
    }
  )
}

/**
 * 获取有效值
 * @param val 值
 */
function getValidValue<T extends undefined | number>(val: T): T {
  if (val === undefined) return val
  const { min, max } = props
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

const tween = new Tween(
  { n: model.value ?? 0 },
  {
    onUpdate(state) {
      const _rawInput = inputDom.value
      if (!_rawInput) return
      _rawInput.value = getDisplayed(state.n)
    },
    // 动画进行的过程值有可能被改变, 因此在onComplete中确保还原的是原本的值
    onComplete() {
      const _rawInput = inputDom.value
      if (!_rawInput) return
      _rawInput.value = getDisplayed(model.value)
    }
  }
)

/** 增 */
function increase(): void {
  if (disabled.value) return
  const val = model.value ?? 0
  tween.state.n = val
  const target = getValidValue(n.plus(val, stepVal.value))
  model.value = target

  tween.to({ n: target })
}

/** 减 */
function decrease(): void {
  if (disabled.value) return
  const val = model.value ?? 0
  tween.state.n = val
  const target = getValidValue(n.minus(val, stepVal.value))
  model.value = target
  tween.to({ n: target })
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
  const { precision, maxPrecision, minPrecision } = props

  model.value = +n(model.value).fixed(
    precision ?? {
      maxPrecision,
      minPrecision
    }
  )
}

function handleBlur(): void {
  focused.value = false
  model.value = props.modelValue
}
</script>
