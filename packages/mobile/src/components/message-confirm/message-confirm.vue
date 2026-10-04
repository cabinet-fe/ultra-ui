<template>
  <div :class="[cls.b, cls.m(size)]" :style="{ zIndex: layer }">
    <div :class="cls.e('mask')"></div>
    <div :class="cls.e('box')" role="alertdialog" aria-modal="true">
      <div :class="cls.e('header')" v-if="title">{{ title }}</div>
      <div :class="cls.e('content')">{{ message }}</div>
      <div :class="cls.e('footer')">
        <UButton
          plain
          :class="cls.em('footer', 'btn')"
          v-if="cancelButtonText"
          @click="emit('close', 'cancel')"
          >{{ cancelButtonText }}</UButton
        >
        <UButton
          :type="confirmButtonType"
          :class="cls.em('footer', 'btn')"
          @click="emit('close', 'confirm')"
          >{{ confirmButtonText }}</UButton
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { bem, zIndex } from '@veltra/utils'
import type { ColorType } from '@veltra/utils'

import type { MessageConfirmEmits, MessageConfirmProps } from '../../types/message-confirm'
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

const cls = bem('message-confirm')

const size = props.size ?? 'default'

// 函数式调用由 API 层分配层级；组件直用时自增兜底
const layer = props.zIndex ?? zIndex()
</script>
