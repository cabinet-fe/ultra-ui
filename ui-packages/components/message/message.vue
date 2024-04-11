<template>
  <transition name="fade" @before-leave="onClose" @after-leave="$emit('destroy')">
    <div
      :class="[cls.b, cls.m(size), cls.e(type)]"
      v-show="visible"
      :style="customStyle"
      @mouseenter="clearTimer"
      @mouseleave="startTimer"
    >
      <div :class="cls.e('icon')">
        <UIcon>
          <component :is="typeIcon" />
        </UIcon>
      </div>
      <div :class="cls.e('content')">
        {{ message }}
      </div>
      <div :class="cls.e('close')" v-if="closable" @click.stop="close">
        <UIcon><Close /></UIcon>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { MessageProps, MessageExposed } from '@ui/types/components/message'
import { bem } from '@ui/utils'
import { onMounted, ref, computed, type CSSProperties } from 'vue'
import { useFallbackProps } from '@ui/compositions'
import {
  Close,
  CircleCheckFilled,
  InfoFilled,
  WarningFilled,
  CircleCloseFilled,
  QuestionFilled
} from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'Message'
})

const props = defineProps<MessageProps>()

const { type, size, closable, duration, offset } = useFallbackProps([props], {
  type: 'primary',
  size: 'default',
  closable: false,
  duration: 3000,
  offset: 20
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

const cls = bem('message')

const visible = ref<boolean>(false)

onMounted(() => {
  visible.value = true
  startTimer()
})

const close = () => {
  visible.value = false
}

const customStyle = computed<CSSProperties>(() => ({
  top: `${offset.value}px`
}))

const timer = ref(0)

const startTimer = () => {
  if (duration.value) {
    timer.value = setTimeout(() => {
      close()
    }, duration.value)
  }
}

const clearTimer = () => clearTimeout(timer.value)

defineExpose<MessageExposed>({ startTimer, clearTimer })
</script>
