<template>
  <transition
    name="message-fade"
    appear
    @before-leave="onClose"
    @after-leave="emit('destroy')"
    @appear="startClose"
  >
    <div
      :class="[cls.b, cls.m(size), cls.m('color-' + getTypeColor(type))]"
      v-if="visible"
      @mouseenter="suspendClose"
      @mouseleave="close"
    >
      <div :class="cls.e('icon')">
        <UIcon>
          <component :is="getTypeIcon(type, icon)" />
        </UIcon>
      </div>
      <div :class="cls.e('content')" v-if="html" v-html="message"></div>
      <div :class="cls.e('content')" v-else>
        {{ message }}
      </div>
      <div :class="cls.e('close')" v-if="closable" @click.stop="immediateClose">
        <UIcon><Close /></UIcon>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { MessageProps, MessageExposed } from '@ui/types/components/message'
import { bem } from '@ui/utils'
import { ref } from 'vue'
import { useFallbackProps } from '@ui/compositions'
import { Close } from 'icon-ultra'
import { UIcon } from '../icon'
import { getTypeColor, getTypeIcon } from './helper'

defineOptions({
  name: 'Message'
})

const props = withDefaults(defineProps<MessageProps>(), {
  type: 'default',
  duration: 3000,
  offset: 20
})

const emit = defineEmits<{
  (e: 'destroy'): void
}>()

const { size } = useFallbackProps([props], {
  size: 'default'
})

const cls = bem('message')

const visible = ref<boolean>(true)

let startTime = 0
let timer: number
let restDuration = 0

function close() {
  startTime = Date.now()
  timer = setTimeout(() => {
    visible.value = false
  }, restDuration)
}

function startClose() {
  if (props.duration <= 0) return
  restDuration = props.duration
  close()
}

function suspendClose() {
  clearTimeout(timer)
  restDuration = restDuration - (Date.now() - startTime)
}

function immediateClose() {
  visible.value = false
}

defineExpose<MessageExposed>({ immediateClose, suspendClose })
</script>
