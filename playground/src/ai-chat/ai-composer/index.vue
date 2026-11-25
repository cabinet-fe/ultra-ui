<template>
  <div>
    <CustomCard title="基础用法（默认极简态）">
      <div class="demo-controls">
        <label class="demo-toggle">
          <span>生成中 (running)</span>
          <USwitch v-model="running" />
        </label>
        <label class="demo-toggle">
          <span>禁用 (disabled)</span>
          <USwitch v-model="disabled" />
        </label>
        <UButton size="small" plain @click="fillSampleText">填充示例文本</UButton>
        <UButton size="small" plain @click="attachSampleImage">附带示例图片</UButton>
        <UButton size="small" plain @click="composerRef?.focus()">聚焦输入框</UButton>
      </div>

      <UAiComposer
        ref="composerRef"
        v-model="text"
        v-model:attachments="attachments"
        :running="running"
        :disabled="disabled"
        @send="handleSend"
        @abort="handleAbort"
        @preview-image="openPreview"
      />

      <div v-if="lastEvent" class="demo-log">{{ lastEvent }}</div>
    </CustomCard>

    <CustomCard title="工具栏插槽组合（脱离 UAiChat 自由装配）">
      <UAiComposer
        v-model="slotText"
        v-model:attachments="slotAttachments"
        placeholder="支持左侧挂载上下文拾取器，右侧挂载用量环、模型与推理选择器"
        @send="handleSlotSend"
        @preview-image="openPreview"
      >
        <template #toolbar-left="{ addAttachments, disabled: toolbarDisabled }">
          <UAiContextPicker
            :items="contextItems"
            :disabled="toolbarDisabled"
            @add-attachments="addAttachments"
            @select="handleContextSelect"
          />
        </template>

        <template #toolbar-right="{ disabled: toolbarDisabled }">
          <UAiContextUsage
            :usage="usage"
            :last-request-usage="usage"
            :context-window="currentModel?.contextWindow"
            detail
          />
          <UAiModelPicker
            v-model="model"
            :models="models"
            :disabled="toolbarDisabled"
            @change="handleModelChange"
          />
          <UAiReasoningPicker
            v-model="reasoningLevel"
            :levels="currentModel?.reasoningLevels ?? []"
            :disabled="toolbarDisabled"
          />
        </template>
      </UAiComposer>

      <div v-if="slotLog" class="demo-log">{{ slotLog }}</div>
    </CustomCard>

    <UImagePreviewer
      v-model:open="previewOpen"
      :src="previewTarget?.src"
      :alt="previewTarget?.alt"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  type AiComposerExposed,
  type AiContextPickerItem,
  type ChatAttachment,
  type ChatModel,
  type ChatTokenUsage,
  UAiComposer,
  UAiContextPicker,
  UAiContextUsage,
  UAiModelPicker,
  UAiReasoningPicker
} from '@veltra/ai'
import { UButton, UImagePreviewer, USwitch, message } from '@veltra/desktop'
import { Books, Folder, Link } from '@veltra/icons/normal'
import { computed, ref, shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import { createSampleImageAttachment } from '../demo-attachments'

const composerRef = useTemplateRef<AiComposerExposed>('composerRef')
const text = ref('')
const attachments = ref<ChatAttachment[]>([])
const running = ref(false)
const disabled = ref(false)
const lastEvent = ref('')

const fillSampleText = () => {
  composerRef.value?.setContent('请帮我梳理本次组件拆分后的独立用法与注意事项')
  composerRef.value?.focus()
}

const attachSampleImage = () => {
  composerRef.value?.addAttachments([createSampleImageAttachment('blue')])
}

const handleSend = (content: string, files: ChatAttachment[]) => {
  lastEvent.value = `send：内容 ${content.length} 字，附件 ${files.length} 个`
  message.success('已触发发送事件')
}

const handleAbort = () => {
  running.value = false
  lastEvent.value = 'abort：已停止生成'
  message.info('已触发中止事件')
}

const models: ChatModel[] = [
  {
    id: 'veltra-pro',
    label: 'Veltra Pro',
    description: '多档推理模型（128K 上下文）',
    contextWindow: 128_000,
    reasoningLevels: [
      { value: 'low', label: '标准' },
      { value: 'high', label: '深度' },
      { value: 'max', label: '极致' }
    ]
  },
  { id: 'veltra-lite', label: 'Veltra Lite', description: '轻量快速模型', contextWindow: 32_000 }
]

const contextItems: AiContextPickerItem[] = [
  { key: 'docs', label: '引用组件文档', description: '附加 @veltra/ai 组件接口说明', icon: Books },
  { key: 'dir', label: '关联组件目录', description: 'packages/ai/src/components', icon: Folder },
  { key: 'tokens', label: '设计令牌', description: '附加 --u-* 主题变量说明', icon: Link }
]

const slotText = ref('')
const slotAttachments = ref<ChatAttachment[]>([])
const model = ref('veltra-pro')
const reasoningLevel = ref<string | undefined>('high')
const slotLog = ref('')

const usage: ChatTokenUsage = {
  promptTokens: 18_400,
  completionTokens: 2_600,
  totalTokens: 21_000,
  cacheHitTokens: 9_600,
  cacheMissTokens: 8_800
}

const currentModel = computed(() => models.find((item) => item.id === model.value))

const handleModelChange = (_id: string, target: ChatModel) => {
  reasoningLevel.value = target.reasoningLevels?.[0]?.value
}

const handleContextSelect = (item: AiContextPickerItem) => {
  const content = `上下文标识：${item.key}\n说明：${item.description ?? item.label}`
  slotAttachments.value = [
    ...slotAttachments.value,
    {
      name: `${item.key}.txt`,
      mimeType: 'text/plain',
      size: new Blob([content]).size,
      dataUrl: '',
      textContent: content
    }
  ]
}

const handleSlotSend = (content: string, files: ChatAttachment[]) => {
  slotLog.value = `send（${model.value}${reasoningLevel.value ? ` / ${reasoningLevel.value}` : ''}）：${content || '[仅附件]'}（附件 ${files.length} 个）`
}

const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const openPreview = (src: string, alt?: string) => {
  if (!src) return
  previewTarget.value = { src, alt }
  previewOpen.value = true
}
</script>

<style scoped lang="scss">
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-log {
  margin-top: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
