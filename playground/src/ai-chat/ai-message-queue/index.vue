<template>
  <div>
    <CustomCard title="可交互待发送队列（插队 · 取回编辑 · 移除）">
      <div class="demo-actions">
        <UInput
          v-model="draft"
          placeholder="输入排队消息，点击入队或从下方队列取回编辑"
          clearable
        />
        <UButton size="small" type="primary" @click="enqueueDraft">加入队列</UButton>
        <UButton size="small" plain @click="resetQueue">重置队列</UButton>
      </div>

      <UAiMessageQueue
        :queue="queue"
        @start-now="handleStartNow"
        @edit="handleEdit"
        @remove="handleRemove"
      />

      <div v-if="lastAction" class="demo-log">{{ lastAction }}</div>
    </CustomCard>

    <CustomCard title="只读队列 (readonly)">
      <UAiMessageQueue :queue="readonlyQueue" readonly />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatQueuedMessage, UAiMessageQueue } from '@veltra/ai'
import { UButton, UInput, message } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const initialQueue = (): ChatQueuedMessage[] => [
  { id: 'q-1', content: '补充说明 `UAiSidePanel` 的全屏定位容器要求' },
  { id: 'q-2', content: '生成一份独立组件迁移 checklist' },
  { id: 'q-3', content: '检查单元测试覆盖情况' }
]

const queue = ref<ChatQueuedMessage[]>(initialQueue())
const draft = ref('')
const lastAction = ref('')
let seq = 4

const readonlyQueue: ChatQueuedMessage[] = [
  { id: 'rq-1', content: '只读模式隐藏插队、编辑与移除按钮' },
  { id: 'rq-2', content: '仅作待执行排队状态展示' }
]

const enqueueDraft = () => {
  const content = draft.value.trim()
  if (!content) {
    message.warning('请输入排队内容')
    return
  }
  queue.value = [...queue.value, { id: `q-${seq++}`, content }]
  draft.value = ''
}

const handleStartNow = (id: string) => {
  const target = queue.value.find((item) => item.id === id)
  queue.value = queue.value.filter((item) => item.id !== id)
  if (target) {
    lastAction.value = `start-now：插队立即发送「${target.content}」`
    message.success('已插队立即开始')
  }
}

const handleEdit = (id: string) => {
  const target = queue.value.find((item) => item.id === id)
  queue.value = queue.value.filter((item) => item.id !== id)
  if (target) {
    draft.value = target.content
    lastAction.value = `edit：已将「${target.content}」取回至上方输入框`
  }
}

const handleRemove = (id: string) => {
  queue.value = queue.value.filter((item) => item.id !== id)
  lastAction.value = `remove：已移除排队项 ${id}`
}

const resetQueue = () => {
  queue.value = initialQueue()
  lastAction.value = ''
}
</script>

<style scoped lang="scss">
.demo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .u-input {
    flex: 1;
  }
}

.demo-log {
  margin-top: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
