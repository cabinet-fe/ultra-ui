<template>
  <u-input
    :class="cls.b"
    :model-value="passwordText"
    v-bind="inputProps"
    :size="size"
    :readonly="readonly"
    :disabled="disabled"
    @native:input="handleUpdatePwd"
    @update:model-value="!$event && handleClear()"
    @suffix:click="toggleVisible"
  >
    <template #suffix>
      <Transition name="fade">
        <UIcon :class="cls.e('visibility-toggle')" :size="18">
          <Hide v-if="pwdVisible" />
          <View v-else />
        </UIcon>
      </Transition>
    </template>

    <template #prefix v-if="slots.prefix">
      <slot name="prefix" />
    </template>
  </u-input>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { Hide, View } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef } from 'vue'

import type { PasswordInputProps } from '../../types'
import { UIcon } from '../icon'
import { UInput } from '../input'

defineOptions({
  name: 'PasswordInput'
})

const props = withDefaults(defineProps<PasswordInputProps>(), {
  clearable: false,
  disabled: undefined,
  readonly: undefined
})

const slots = defineSlots<{
  prefix?: () => any
}>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const inputProps = computed(() => {
  return o(props).pick(['clearable', 'disabled', 'placeholder', 'size'])
})

const cls = bem('password-input')

const model = defineModel<string>()

const passwordChar = '●'

const handleUpdatePwd = (e: Event): void => {
  const target = e.target as HTMLInputElement
  const val = target.value
  if (!val) {
    model.value = val
    return
  }

  // 字符从无到有
  if (!model.value) {
    model.value = val
    return
  }

  const pointIndex = target.selectionStart!
  let inputChar = pointIndex === 0 ? '' : val[pointIndex - 1]!
  if (inputChar === passwordChar) inputChar = ''

  // 光标右侧字符数量（当前字符长度减去光标位置）
  const rightLen = val.length - pointIndex
  // 光标左侧字符数量 （当光标前的字符是刚刚输入的，则为这个字符前的所有的字符，否则为光标前的所有赐福）
  const leftLen = inputChar === '' ? pointIndex : pointIndex - 1

  const leftVal = model.value.slice(0, leftLen)
  const rightVal = rightLen === 0 ? '' : model.value.slice(-rightLen)

  model.value = leftVal + inputChar + rightVal

  nextTick(() => {
    target.selectionStart = pointIndex
    target.selectionEnd = pointIndex
  })
}

const handleClear = (): void => {
  model.value = ''
}

const pwdVisible = shallowRef(false)

const passwordText = computed<string | undefined>(() => {
  if (pwdVisible.value) return model.value
  return model.value ? passwordChar.repeat(model.value.length) : ''
})

const toggleVisible = () => {
  pwdVisible.value = !pwdVisible.value
}
</script>
