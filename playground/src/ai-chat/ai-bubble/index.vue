<template>
  <div>
    <CustomCard title="用户与助手消息气泡">
      <div class="bubble-stack">
        <UAiBubble :message="userMessage" @preview-image="openPreview" />
        <UAiBubble
          :message="assistantMessage"
          is-last
          :duration="3200"
          @copy="() => message.success('已触发 copy 事件')"
          @regenerate="() => message.info('已触发 regenerate 事件')"
        />
      </div>
    </CustomCard>

    <CustomCard title="流式输出与终态状态">
      <div class="demo-actions">
        <UButton size="small" type="primary" plain @click="startStreaming">模拟流式打字</UButton>
      </div>
      <div class="bubble-stack">
        <UAiBubble :message="streamingMessage" is-last />
        <UAiBubble :message="errorMessage" :show-actions="false" />
        <UAiBubble :message="abortedMessage" :show-actions="false" />
      </div>
    </CustomCard>

    <CustomCard title="自定义操作区插槽 (#actions)">
      <UAiBubble :message="assistantMessage" is-last>
        <template #actions="{ copied, copy }">
          <UButton size="small" plain @click="copy">{{ copied ? '已复制' : '复制全文' }}</UButton>
          <UButton size="small" text @click="() => message.info('已点赞该回答')">点赞</UButton>
        </template>
      </UAiBubble>
    </CustomCard>

    <UImagePreviewer
      v-model:open="previewOpen"
      :src="previewTarget?.src"
      :alt="previewTarget?.alt"
    />
  </div>
</template>

<script lang="ts" setup>
import { type ChatMessage, UAiBubble } from '@veltra/ai'
import { UButton, UImagePreviewer, message } from '@veltra/desktop'
import { onBeforeUnmount, ref, shallowRef } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import { createSampleAttachments } from '../demo-attachments'

const userMessage: ChatMessage = {
  id: 'u-1',
  role: 'user',
  content: '请结合这两张架构草图与接口契约，梳理消息气泡的渲染要点。',
  attachments: createSampleAttachments().slice(0, 3)
}

const assistantMessage: ChatMessage = {
  id: 'a-1',
  role: 'assistant',
  status: 'done',
  content:
    '### 消息气泡渲染要点\n\n- **用户气泡**：自动组合 `UAiAttachments` 展示图片与文档附件。\n- **助手气泡**：通过 `MarkdownRender` 增量渲染正文，并内置复制、重新生成与耗时统计。\n\n```ts\n<UAiBubble :message="msg" :duration="3200" is-last />\n```'
}

const streamChunks = [
  '正在按段落流式输出：',
  '\n1. `UAiBubble` 支持独立接收单条 `ChatMessage`。',
  '\n2. 流式态通过 `useStreamThrottle` 降低重排频率。',
  '\n3. 落定为 `done` 后自动显示底部操作栏。'
]

const streamingMessage = ref<ChatMessage>({
  id: 'a-stream',
  role: 'assistant',
  status: 'done',
  content: streamChunks.join('')
})

let streamTimer: ReturnType<typeof setInterval> | undefined

const startStreaming = () => {
  clearInterval(streamTimer)
  let index = 0
  streamingMessage.value = { id: 'a-stream', role: 'assistant', status: 'streaming', content: '' }
  streamTimer = setInterval(() => {
    if (index >= streamChunks.length) {
      clearInterval(streamTimer)
      streamingMessage.value = { ...streamingMessage.value, status: 'done' }
      return
    }
    streamingMessage.value = {
      ...streamingMessage.value,
      content: streamingMessage.value.content + streamChunks[index]!
    }
    index += 1
  }, 350)
}

const errorMessage: ChatMessage = {
  id: 'a-err',
  role: 'assistant',
  status: 'error',
  content: '部分输出内容已保留。'
}

const abortedMessage: ChatMessage = {
  id: 'a-abort',
  role: 'assistant',
  status: 'aborted',
  content: '回答已在生成中途停止。'
}

const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const openPreview = (src: string, alt?: string) => {
  if (!src) return
  previewTarget.value = { src, alt }
  previewOpen.value = true
}

onBeforeUnmount(() => {
  clearInterval(streamTimer)
})
</script>

<style scoped lang="scss">
.bubble-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-actions {
  margin-bottom: 12px;
}
</style>
