<template>
  <div :class="[cls.b, cls.m(size)]" :style="overlayStyle">
    <div :class="cls.e('mask')" :style="overlayStyle">
      <div :class="cls.e('box')" :style="overlayStyle">
        <div :class="cls.e('header')" v-if="title">{{ title }}</div>
        <div :class="cls.e('content')">{{ message }}</div>
        <div :class="cls.e('footer')">
          <UButton plain v-if="cancelButtonText" @click="emit('close', 'cancel')">
            {{ cancelButtonText }}
          </UButton>
          <UButton plain :type="confirmButtonType" @click="emit('close', 'confirm')">
            {{ confirmButtonText }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { useFallbackProps } from '@veltra/compositions'
import { bem, zIndex } from '@veltra/utils'

import type {
  MessageConfirmProps,
  MessageConfirmEmits,
  ColorType,
  ComponentSize
} from '../../types'
import { UButton } from '../button'

defineOptions({ name: 'UMessageConfirm' })

const props = withDefaults(defineProps<MessageConfirmProps>(), {
  title: '',
  message: '',
  confirmButtonText: '确定',
  confirmButtonType: 'primary' as ColorType,
  cancelButtonText: ''
})

const emit = defineEmits<MessageConfirmEmits>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('message-confirm')
const overlayStyle = { zIndex: props.zIndex ?? zIndex() }
</script>
