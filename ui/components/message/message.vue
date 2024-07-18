<template>
  <li
    :class="[cls.b, cls.m(size), cls.m('color-' + getTypeColor(type))]"
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
    <div
      :class="cls.e('close')"
      v-if="closable || duration === 0"
      @click.stop="immediateClose"
    >
      <UIcon><Close /></UIcon>
    </div>
  </li>
</template>

<script lang="ts" setup>
import type { MessageProps } from '@ui/types/components/message'
import { bem } from '@ui/utils'
import { onMounted } from 'vue'
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
  (e: 'close'): void
}>()

const { size } = useFallbackProps([props], {
  size: 'default'
})

const cls = bem('message')

let startTime = 0
let timer: number
let restDuration = 0

function close() {
  if (props.duration === 0) return
  startTime = Date.now()
  timer = setTimeout(() => {
    emit('close')
  }, restDuration)
}

function startClose() {
  if (props.duration <= 0) return
  restDuration = props.duration
  close()
}

onMounted(() => {
  startClose()
})

function suspendClose() {
  clearTimeout(timer)
  restDuration = restDuration - (Date.now() - startTime)
}

function immediateClose() {
  emit('close')
}
</script>
