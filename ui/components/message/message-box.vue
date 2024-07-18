<template>
  <transition-group name="message" appear @after-leave="handleAfterLeave">
    <UMessage
      v-for="({ onClose, ...message }, index) of messages"
      v-bind="message"
      :data-id="message.key"
      @close="handleClose(index, onClose)"
    />
  </transition-group>
</template>

<script lang="ts" setup>
import type { MessageOptions } from '@ui/types/components/message'
import UMessage from './message.vue'

defineOptions({
  name: 'MessageBox'
})

defineProps<{
  messages: Array<Omit<MessageOptions & { key: string }, 'onClosed'>>
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'close', index: number): void
}>()

function handleAfterLeave(el: Element) {
  emit('remove', (el as HTMLElement).dataset.id as string)
}

function handleClose(i: number, onClose?: () => void) {
  emit('close', i)
  onClose?.()
}
</script>
