<template>
  <div :class="[cls.b, cls.m(size)]">
    <div :class="cls.e('mask')" :style="{ zIndex }">
      <div :class="cls.e('box')">
        <div :class="cls.e('header')" v-if="title">{{ title }}</div>
        <div :class="cls.e('content')">{{ message }}</div>
        <div :class="cls.e('footer')">
          <UButton
            plain
            @click="emit('close', 'cancel')"
            :class="cls.em('footer', 'btn')"
            v-if="cancelButtonText"
            >{{ cancelButtonText }}</UButton
          >
          <UButton
            :type="confirmButtonType"
            @click="emit('close', 'confirm')"
            :class="cls.em('footer', 'btn')"
            >{{ confirmButtonText }}</UButton
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'

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
</script>
