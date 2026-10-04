<template>
  <div v-if="visible" :class="className" role="alert">
    <u-icon v-if="showIcon" :class="cls.e('icon')">
      <component :is="typeIcons[type]" />
    </u-icon>

    <div :class="cls.e('content')">
      <div v-if="$slots.title || title" :class="cls.e('title')">
        <slot name="title">{{ title }}</slot>
      </div>

      <div v-if="$slots.default || description" :class="cls.e('description')">
        <slot>{{ description }}</slot>
      </div>
    </div>

    <u-icon v-if="closable" :class="cls.e('close')" @click.stop="handleClose">
      <Close />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import {
  CircleCheckFilled,
  CircleClose,
  Close,
  InfoFilled,
  WarningFilled
} from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, ref, type Component } from 'vue'

import type { AlertEmits, AlertProps, AlertType } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'Alert' })

const { type = 'info', closable, showIcon } = defineProps<AlertProps>()

const emit = defineEmits<AlertEmits>()

const cls = bem('alert')

const visible = ref(true)

/** 语义类型对应的图标 */
const typeIcons: Record<AlertType, Component> = {
  info: InfoFilled,
  success: CircleCheckFilled,
  warning: WarningFilled,
  error: CircleClose
}

const className = computed(() => [cls.b, cls.m(type)])

/** 点击关闭图标后隐藏自身并发出 close 事件 */
const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>
