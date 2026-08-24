<template>
  <transition-group name="message-confirm" tag="div" appear @after-leave="handleAfterLeave">
    <UMessageConfirm
      v-for="{ onClose, onClosed, ...confirm } of confirms"
      v-bind="confirm"
      :key="confirm.key"
      :data-key="confirm.key"
      @close="handleClose(confirm.key, onClose, $event)"
    />
  </transition-group>
</template>

<script lang="ts" setup>
import type { MessageConfirmAction, MessageConfirmOptions } from '../../types'
import UMessageConfirm from './message-confirm.vue'

defineOptions({ name: 'UMessageConfirmBox' })

type ConfirmItem = MessageConfirmOptions & { key: string }

defineProps<{ confirms: ConfirmItem[] }>()

const emit = defineEmits<{
  (e: 'closed', key: string): void
  (e: 'close', key: string, action: MessageConfirmAction): void
}>()

function handleAfterLeave(el: Element) {
  emit('closed', (el as HTMLElement).dataset.key as string)
}

function handleClose(key: string, onClose: ConfirmItem['onClose'], action: MessageConfirmAction) {
  emit('close', key, action)
  onClose?.(action)
}
</script>
