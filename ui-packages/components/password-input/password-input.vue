<template>
  <u-input
    :class="cls.b"
    :model-value="passwordText"
    @native:input="handleUpdatePwd"
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

const handleUpdatePwd = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = target.value
  if (!val) return (model.value = val)

  // 字符从无到有
  if (!model.value) {
    model.value = val
    return
  }

  const pointIndex = target.selectionStart!
  const inputChar = val[pointIndex - 1]!

  // 光标右侧字符数量，以此来将左侧的字符切割出来
  const rightLen = val.length - pointIndex


  const leftVal = model.value.slice(0, (inputChar === passwordChar || inputChar === '') ? pointIndex : pointIndex - 1)
  const rightVal = rightLen === 0 ? '' : model.value.slice(-rightLen)

  console.log(pointIndex, leftVal)

  model.value =
    leftVal + (inputChar === passwordChar ? '' : inputChar) + rightVal

  nextTick(() => {
    target.selectionStart = pointIndex
    target.selectionEnd = pointIndex
  })
}

const pwdVisible = shallowRef(false)

const passwordText = computed(() => {
  if (pwdVisible.value) return model.value
  return model.value ? passwordChar.repeat(model.value.length) : undefined
})

const toggleVisible = () => {
  pwdVisible.value = !pwdVisible.value
}
</script>
