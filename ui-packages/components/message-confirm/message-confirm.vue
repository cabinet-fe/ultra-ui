<template>
  <transition name="message-confirm-fade" @after-leave="$emit('destroy')">
    <div :class="[cls.b, cls.m(size)]" v-show="visible">
      <div :class="cls.e('mask')">
        <div :class="cls.e('box')">
          <div :class="cls.e('header')" v-if="title">{{ title }}</div>
          <div :class="cls.e('content')">{{ message }}</div>
          <div :class="cls.e('footer')">
            <UButton :type="buttonType" @click="close">{{ buttonText }}</UButton>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { MessageConfirmProps } from '@ui/types/components/message-confirm'
import { bem } from '@ui/utils'
import { UButton } from '../button'
import { useFallbackProps } from '@ui/compositions'
import { ref, onMounted } from 'vue'

defineOptions({
  name: 'MessageConfirm'
})

const props = defineProps<MessageConfirmProps>()

const { title, message, size, buttonText, buttonType } = useFallbackProps([props], {
  title: 'title',
  message: 'message',
  size: 'default',
  buttonText: '确定',
  buttonType: 'primary'
})

const cls = bem('message-confirm')

const visible = ref<boolean>(false)

onMounted(() => {
  visible.value = true
})

const close = () => {
  visible.value = false
  if (props.onClose) props.onClose()
}
</script>
