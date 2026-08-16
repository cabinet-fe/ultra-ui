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
      :placeholder="placeholderText"
      rows="1"
      @keydown.enter.exact.prevent="handleSend"
      @input="autoResize"
    />

    <div :class="cls.e('input-toolbar')">
      <div :class="cls.e('input-toolbar-left')">
        <UFilePicker multiple :accept="accept ?? 'image/*'" @pick="handlePick">
          <UIcon :class="cls.e('input-attach')" title="添加图片">
            <Attach />
          </UIcon>
        </UFilePicker>
      </div>

      <!-- 右簇：模型/推理选择 → 发送/停止，贴近发送按钮 -->
      <div :class="cls.e('input-toolbar-right')">
        <ModelPicker
          v-if="models?.length"
          v-model:model="model"
          v-model:reasoning-level="reasoningLevel"
          :models="models"
        />

        <!-- 生成中：发送按钮变为入队（有内容时可点），旁边提供停止 -->
        <template v-if="running">
          <UButton
            size="small"
            type="primary"
            circle
            :disabled="!hasContent"
            :icon="Up"
            title="加入待发送队列"
            @click="handleSend"
          />
          <UButton size="small" type="danger" circle title="停止生成" @click="emit('abort')">
            <span :class="cls.e('input-stop')" />
          </UButton>
        </template>
        <UButton
          v-else
          size="small"
          type="primary"
          circle
          :disabled="!hasContent"
          :icon="Up"
          @click="handleSend"
        >
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UFilePicker, UIcon } from '@veltra/desktop'
import { Attach, Close, Up } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, ref, shallowRef } from 'vue'

import type { ChatAttachment } from '../../chat/types'
import type { ChatModelOption } from '../../providers'
import { AiChatDIKey } from './di'
import ModelPicker from './model-picker.vue'

defineOptions({ name: 'UAiChatInput' })

const props = defineProps<{
  /** 是否生成中（发送变为入队，并提供停止按钮） */
  running: boolean
  /** 可选模型列表；有值则显示选择器 */
  models?: ChatModelOption[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型 */
  accept?: string
  /** 单个附件最大字节数 */
  maxAttachmentSize?: number
}>()

const model = defineModel<string>('model')
const reasoningLevel = defineModel<string>('reasoningLevel')

const emit = defineEmits<{
  (e: 'send', content: string, attachments: ChatAttachment[]): void
  (e: 'abort'): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const text = ref('')
const attachments = ref<ChatAttachment[]>([])
const textareaRef = shallowRef<HTMLTextAreaElement>()

const hasContent = computed(() => !!text.value.trim() || attachments.value.length > 0)

/** 生成中提示用户消息将进入队列 */
const placeholderText = computed(() => {
  if (props.running) return '会话进行中，发送的消息将进入待发送队列'
  return props.placeholder ?? '输入消息，Enter 发送，Shift + Enter 换行'
})

/** 多行自适应高度，上限 160px */
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

const handleSend = () => {
  if (!hasContent.value) return
  emit('send', text.value.trim(), attachments.value)
  text.value = ''
  attachments.value = []
  autoResize()
}

/** 取回内容到输入框（队列编辑场景），并聚焦 */
const setContent = (content: string) => {
  text.value = content
  void nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

/** 读取当前输入框内容 */
const getContent = () => text.value

defineExpose({ setContent, getContent })

/** 将拾取的文件转为 dataUrl 附件（超限忽略） */
const handlePick = (files: File[]) => {
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
