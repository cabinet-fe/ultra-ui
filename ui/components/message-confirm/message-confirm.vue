<template>
  <transition name="message-confirm-fade" @after-leave="$emit('destroy')">
    <div :class="[cls.b, cls.m(size)]" v-show="visible">
      <div :class="cls.e('mask')" :style="{ zIndex: `${zIndex()}`}">
        <div :class="cls.e('box')">
          <div :class="cls.e('header')" v-if="title">{{ title }}</div>
          <div :class="cls.e('content')">{{ message }}</div>
          <div :class="cls.e('footer')">
            <UButton
              plain
              @click="close('cancel')"
              :class="cls.em('footer', 'btn')"
              v-if="cancelButtonText"
              >{{ cancelButtonText }}</UButton
            >
            <UButton
              :type="confirmButtonType"
              @click="close('confirm')"
              :class="cls.em('footer', 'btn')"
              >{{ confirmButtonText }}</UButton
            >
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
import type { ColorType, ComponentSize } from '@ui/types/component-common'
import { zIndex } from '@ui/utils'

defineOptions({
  name: 'MessageConfirm'
})

const props = withDefaults(defineProps<MessageConfirmProps>(), {
  title: '',
  message: '',
  confirmButtonText: '确定',
  confirmButtonType: 'primary' as ColorType,
  cancelButtonText: ''
})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('message-confirm')

const visible = ref<boolean>(false)

onMounted(() => {
  visible.value = true
})

const close = (action: 'cancel' | 'confirm') => {
  visible.value = false
  if (props.onClose) props.onClose(action)
}
</script>
