<template>
  <div>
    <CustomCard title="默认尺寸（气泡展示态 · 点击图片预览）">
      <UAiAttachments
        :items="defaultItems"
        size="default"
        @preview="(item) => openPreview(item.dataUrl, item.name)"
      />
    </CustomCard>

    <CustomCard title="紧凑尺寸（输入区态 · 可移除）">
      <div class="demo-actions">
        <UButton size="small" plain @click="resetCompact">重置示例附件</UButton>
        <span class="demo-hint">当前剩余 {{ compactItems.length }} 个附件</span>
      </div>

      <UAiAttachments
        :items="compactItems"
        size="compact"
        removable
        @remove="handleRemove"
        @preview="(item) => openPreview(item.dataUrl, item.name)"
      />
      <div v-if="!compactItems.length" class="demo-empty">
        附件列表为空时 `UAiAttachments` 不渲染任何 DOM，点击上方按钮可恢复。
      </div>
    </CustomCard>

    <UImagePreviewer
      v-model:open="previewOpen"
      :src="previewTarget?.src"
      :alt="previewTarget?.alt"
    />
  </div>
</template>

<script lang="ts" setup>
import { type ChatAttachment, UAiAttachments } from '@veltra/ai'
import { UButton, UImagePreviewer, message } from '@veltra/desktop'
import { ref, shallowRef } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import { createSampleAttachments } from '../demo-attachments'

const defaultItems = createSampleAttachments()
const compactItems = ref<ChatAttachment[]>(createSampleAttachments())

const handleRemove = (index: number, item: ChatAttachment) => {
  compactItems.value.splice(index, 1)
  message.info(`已移除附件：${item.name}`)
}

const resetCompact = () => {
  compactItems.value = createSampleAttachments()
}

const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const openPreview = (src: string, alt?: string) => {
  if (!src) {
    message.info('非图片附件无大图预览')
    return
  }
  previewTarget.value = { src, alt }
  previewOpen.value = true
}
</script>

<style scoped lang="scss">
.demo-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-empty {
  font-size: 13px;
  color: var(--u-text-color-assist);
}
</style>
