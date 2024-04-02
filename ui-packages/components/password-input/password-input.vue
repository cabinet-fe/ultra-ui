<template>
  <u-input
    :class="cls.b"
    :model-value="passwordText"
    @native:input="handleUpdatePwd"
    @update:model-value="!$event && handleClear()"
    @suffix:click="toggleVisible"
  >
    <template #suffix>
      <Transition name="fade">
        <UIcon :class="cls.e('visibility-toggle')" :size="14">
          <Hide v-if="pwdVisible" />
          <View v-else />
        </UIcon>
      </Transition>
    </template>
  </u-input>
</template>

<script lang="ts" setup>
import type { PasswordInputProps } from '@ui/types/components/password-input'
import { bem } from '@ui/utils'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { View, Hide } from 'icon-ultra'
import { computed, nextTick, shallowRef } from 'vue'

defineOptions({
  name: 'PasswordInput'
})

defineProps<PasswordInputProps>()

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
