<template>
  <transition
    :name="`notification-fade-${position.split('-')[0]}`"
    @before-leave="onClose"
    @after-leave="$emit('destroy')"
  >
    <div
      :class="[cls.b, cls.m(size), cls.e(type), cls.e(position)]"
      v-show="visible"
      :style="customStyle"
    >
      <div :class="cls.e('icon')">
        <UIcon>
          <component :is="typeIcon" />
        </UIcon>
      </div>
      <div :class="cls.e('content')">
        <div :class="cls.em('content', 'title')">{{ title }}</div>
        <div :class="cls.em('content', 'message')">{{ message }}</div>
        <div :class="cls.em('content', 'button')" v-if="buttonText">
          <UButton :type="type" plain @click="handleClick">{{ buttonText }}</UButton>
        </div>
      </div>
      <div :class="cls.e('close')" v-if="closable" @click.stop="close">
        <UIcon><Close /></UIcon>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { NotificationProps, NotificationExposed } from '@ui/types/components/notification'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'
import { ref, computed, onMounted, type CSSProperties } from 'vue'
import {
  Close,
  CircleCheckFilled,
  InfoFilled,
  WarningFilled,
  CircleCloseFilled,
  QuestionFilled
} from 'icon-ultra'
import { UIcon } from '../icon'
import { UButton } from '../button'
import type { ColorType } from '@ui/types/component-common'

defineOptions({
  name: 'Notification'
})

const props = withDefaults(defineProps<NotificationProps>(), {
  closable: false,
  duration: 4500,
  offset: 20,
  buttonText: '',
  position: 'bottom-right'
})

const { type, size } = useFallbackProps([props], {
  type: 'primary' as ColorType,
  size: 'default'
})

const typeIcon = computed(() => {
  return (
    props.icon ||
    {
      primary: InfoFilled,
      info: QuestionFilled,
      success: CircleCheckFilled,
      warning: WarningFilled,
      danger: CircleCloseFilled
    }[type.value]
  )
})

const cls = bem('notification')

const visible = ref<boolean>(false)

onMounted(() => {
  visible.value = true
  startTimer()
})

const close = () => {
  visible.value = false
}

const customStyle = computed<CSSProperties>(() => {
  return props.offset > 0
    ? {
        [`${props.position.split('-')[0]}`]: `${props.offset}px`,
        zIndex: props.zIndex,
        transform:
          props.position.split('-')[0] === 'bottom'
            ? `translateY(-${props.offset}px)`
            : `translateY(${props.offset}px)`,
        transition: `opacity 0.3s, transform 0.4s, top 0.4s`
      }
    : {
        [`${props.position.split('-')[0]}`]: `${props.offset}px`,
        zIndex: props.zIndex
      }
})

let timer = 0

const startTimer = () => {
  if (props.duration) {
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

const clearTimer = () => clearTimeout(timer)

const handleClick = (e: MouseEvent) => {
  if (props.onClick) props.onClick(e)
  close()
}

defineExpose<NotificationExposed>({ startTimer, clearTimer })
</script>
