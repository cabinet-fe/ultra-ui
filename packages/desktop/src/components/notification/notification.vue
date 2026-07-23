<template>
  <div
    :class="[cls.b, cls.m(size), cls.e(type)]"
    @mouseenter="suspendTimer"
    @mouseleave="startTimer"
  >
    <div :class="cls.e('icon')">
      <UIcon>
        <component :is="typeIcon" />
      </UIcon>
    </div>
    <div :class="cls.e('content')">
      <div :class="cls.em('content', 'title')" v-if="title">{{ title }}</div>
      <div :class="cls.em('content', 'message')" v-if="message">{{ message }}</div>
      <div :class="cls.em('content', 'button')" v-if="buttonText">
        <UButton :type="type" plain @click="(e) => emit('action', e)">{{ buttonText }}</UButton>
      </div>
    </div>
    <div :class="cls.e('close')" v-if="closable || duration === 0" @click.stop="emit('close')">
      <UIcon><Close /></UIcon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import {
  CircleCheckFilled,
  CircleClose,
  Close,
  InfoFilled,
  QuestionFilled,
  WarningFilled
} from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, onMounted } from 'vue'

import type { NotificationEmits, NotificationProps, ColorType } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'

defineOptions({ name: 'UNotification' })

const props = withDefaults(defineProps<NotificationProps>(), {
  closable: false,
  duration: 4500,
  buttonText: ''
})

const emit = defineEmits<NotificationEmits>()

const { type, size } = useFallbackProps([props], { type: 'primary' as ColorType, size: 'default' })

const typeIcon = computed(() => {
  return (
    props.icon ||
    {
      primary: InfoFilled,
      info: QuestionFilled,
      success: CircleCheckFilled,
      warning: WarningFilled,
      danger: CircleClose
    }[type.value]
  )
})

const cls = bem('notification')

/** 剩余时长制的自动关闭计时器, 悬停暂停 */
let startTime = 0
let timer = 0
let restDuration = 0

function startTimer() {
  if (!props.duration) return
  startTime = Date.now()
  timer = setTimeout(() => emit('close'), restDuration)
}

function suspendTimer() {
  if (!props.duration) return
  clearTimeout(timer)
  restDuration -= Date.now() - startTime
}

onMounted(() => {
  restDuration = props.duration
  startTimer()
})

onBeforeUnmount(() => clearTimeout(timer))
</script>
