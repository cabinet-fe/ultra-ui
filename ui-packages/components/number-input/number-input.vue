<template>
  <u-input
    :model-value="displayed"
    @update:model-value="handleUpdateModelValue"
    @change="handleChange"
    ref="inputRef"
    :clearable="clearable"
    @keydown="handleKeydown"
  >
    <template #suffix v-if="step !== undefined && step !== false">
      <div :class="cls.e('step')">
        <u-icon @click="increase"><ArrowUp /></u-icon>
        <u-icon @click="decrease"><ArrowDown /></u-icon>
      </div>
    </template>
  </u-input>
</template>

<script lang="ts" setup>
import type { NumberInputEmits, NumberInputProps } from './number-input.type'
import { UInput, type InputExposed } from '../input'
import { nextTick, shallowRef, watch } from 'vue'
import { n, Tween } from 'cat-kit/fe'
import { useModel } from '@ui/compositions'
import { ArrowUp, ArrowDown } from 'icon-ultra'
import { UIcon } from '../icon'
import { bem } from '@ui/utils'

defineOptions({
  name: 'UNumberInput'
})

const props = defineProps<NumberInputProps>()
const emit = defineEmits<NumberInputEmits>()

const inputRef = shallowRef<InputExposed>()

const cls = bem('number-input')

/** 获取数字的显示内容 */
const getDisplayed = (value?: number): string => {
  if (value === undefined) {
    return ''
  }
  if (props.currency) {
    return n(value).currency('CNY', {
      precision: props.precision,
      minPrecision: props.minPrecision,
      maxPrecision: props.maxPrecision
    })
  }
  return String(value)
}

const model = useModel({ props, emit })

const displayed = shallowRef(getDisplayed(model.value))

watch(model, v => {
  displayed.value = getDisplayed(v)
})

const setCursorPosition = (cursorLastIndex: number, isFirst = false) => {
  setTimeout(() => {
    let index = isFirst ? 1 : displayed.value.length - cursorLastIndex - 1
    if (!inputRef.value?.el) return
    inputRef.value.el.selectionStart = index
    inputRef.value.el.selectionEnd = index
  })
}

const handleUpdateModelValue = (value: string) => {
  // displayed.value的更新会触发input组件的update:modelValue事件,
  // 此时value和displayed.value的值是一致的, 直接过滤
  if (value === displayed.value) return

  // 非货币
  if (!props.currency) {
    const number = +value
    if (!isNaN(number)) model.value = number
  }

  if (value === '') {
    return (model.value = undefined)
  }

  // 货币
  const number = +value.replace(/\,/g, '')

  if (isNaN(number)) return

  // 获取光标位置
  const cursorIndex =
    displayed.value.length - (inputRef.value?.el?.selectionStart ?? 0)

  setCursorPosition(cursorIndex, value.length === 1)

  // 更新值
  model.value = number
}

/**
 * 处理输入值变化的函数, 该函数仅在输入框失去焦点时触发,
 * 主要用于在输入非数字的情况下的回正处理
 * @param value 输入的值
 */
const handleChange = (value: string) => {
  const number = +value

  if (isNaN(number)) {
    // 更新一次值
    displayed.value = getDisplayed(number)
    // 随后将显示内容重置到之前的状态
    nextTick(() => {
      displayed.value = getDisplayed(model.value)
    })
  }
}

const getStepValue = () => {
  const { step } = props
  if (step === undefined) return 1
  return typeof step === 'boolean' ? 1 : step
}

const tween = new Tween(
  {
    n: model.value ?? 0
  },
  {
    onUpdate(state) {
      if (!inputRef.value?.el) return
      inputRef.value.el.value = getDisplayed(+n(state.n).fixed(2))
    }
  }
)

const increase = () => {
  tween.state.n = model.value ?? 0
  model.value = n.plus(model.value ?? 0, getStepValue())
  tween.to({ n: model.value })
}

const decrease = () => {
  tween.state.n = model.value ?? 0
  model.value = n.minus(model.value ?? 0, getStepValue())
  tween.to({ n: model.value })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.step) return
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    model.value = n.plus(model.value ?? 0, getStepValue())
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    model.value = n.minus(model.value ?? 0, getStepValue())
  }
}
</script>
