<template>
  <div :class="cls.e('input-area')">
    <div v-if="attachments.length" :class="cls.e('input-attachments')">
      <div
        v-for="(att, index) in attachments"
        :key="att.dataUrl"
        :class="cls.e('input-attachment')"
      >
        <img :src="att.dataUrl" :alt="att.name" />
        <UIcon :class="cls.e('input-attachment-remove')" @click="attachments.splice(index, 1)">
          <Close />
        </UIcon>
      </div>
    </div>

    <textarea
      ref="textareaRef"
      v-model="text"
      :class="cls.e('input')"
      :placeholder="placeholder ?? '输入消息，Enter 发送，Shift + Enter 换行'"
      rows="1"
      @keydown.enter.exact.prevent="handleSend"
      @input="autoResize"
    />

    <div :class="cls.e('input-toolbar')">
      <UIcon :class="cls.e('input-attach')" title="添加图片" @click="fileRef?.click()">
        <Attach />
      </UIcon>
      <input
        ref="fileRef"
        type="file"
        hidden
        multiple
        :accept="accept ?? 'image/*'"
        @change="handleFiles"
      />

      <UButton v-if="running" type="danger" circle @click="emit('abort')">
        <span :class="cls.e('input-stop')" />
      </UButton>
      <UButton v-else type="primary" circle :disabled="!canSend" @click="handleSend">
        <UIcon><Send /></UIcon>
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UIcon } from '@veltra/desktop'
import { Attach, Close, Send } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, shallowRef } from 'vue'

import type { ChatAttachment } from '../../chat/types'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatInput' })

const props = defineProps<{
  /** 是否生成中（显示停止按钮） */
  running: boolean
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型 */
  accept?: string
  /** 单个附件最大字节数 */
  maxAttachmentSize?: number
}>()

const emit = defineEmits<{
  (e: 'send', content: string, attachments: ChatAttachment[]): void
  (e: 'abort'): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const text = ref('')
const attachments = ref<ChatAttachment[]>([])
const textareaRef = shallowRef<HTMLTextAreaElement>()
const fileRef = shallowRef<HTMLInputElement>()

const canSend = computed(() => {
  return !props.running && (!!text.value.trim() || attachments.value.length > 0)
})

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

const handleSend = () => {
  if (!canSend.value) return
  emit('send', text.value.trim(), attachments.value)
  text.value = ''
  attachments.value = []
  autoResize()
}

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  const maxSize = props.maxAttachmentSize ?? 10 * 1024 * 1024

  for (const file of files) {
    if (file.size > maxSize) {
      console.warn(`[UAiChat] 附件 ${file.name} 超过大小限制，已忽略`)
      continue
    }
    const reader = new FileReader()
    reader.onload = () => {
      attachments.value.push({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: String(reader.result)
      })
    }
    reader.readAsDataURL(file)
  }
}
</script>
