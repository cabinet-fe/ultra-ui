<template>
  <div>
    <CustomCard title="文件上传 + 自定义上下文项">
      <div class="demo-row">
        <UAiContextPicker
          :items="items"
          direction="bottom"
          alignment="start"
          @pick-files="handlePickFiles"
          @add-attachments="handleAddAttachments"
          @select="handleSelect"
        />
        <span class="demo-hint">点击「+」展开上下文面板，可选择本地文件或自定义上下文条目</span>
      </div>

      <div v-if="eventLog" class="demo-log">{{ eventLog }}</div>

      <div v-if="addedAttachments.length" class="demo-attachments">
        <UAiAttachments
          :items="addedAttachments"
          size="compact"
          removable
          @remove="(index) => addedAttachments.splice(index, 1)"
          @preview="(item) => openPreview(item.dataUrl, item.name)"
        />
      </div>
    </CustomCard>

    <CustomCard title="仅自定义选项（关闭上传 + 自定义 #trigger 插槽）">
      <div class="demo-row">
        <UAiContextPicker
          :items="customOnlyItems"
          :upload="false"
          direction="bottom"
          alignment="start"
          @select="handleCustomSelect"
        >
          <template #trigger>
            <UButton size="small" plain>添加上下文</UButton>
          </template>
        </UAiContextPicker>
        <span v-if="customSelected" class="demo-hint">已选：{{ customSelected }}</span>
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
import {
  type AiContextPickerItem,
  type ChatAttachment,
  UAiAttachments,
  UAiContextPicker
} from '@veltra/ai'
import { UButton, UImagePreviewer, message } from '@veltra/desktop'
import { Books, Code, Folder, Link } from '@veltra/icons/normal'
import { ref, shallowRef } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const items: AiContextPickerItem[] = [
  { key: 'schema', label: '接口契约', description: '附加 OpenAPI 字段规范', icon: Books },
  { key: 'workspace', label: '当前工作区', description: '关联 packages/ai 目录结构', icon: Folder },
  {
    key: 'tokens',
    label: '主题规范',
    description: '禁用项示例（不可点击）',
    icon: Link,
    disabled: true
  }
]

const customOnlyItems: AiContextPickerItem[] = [
  { key: 'diff', label: 'Git 变更摘要', description: '注入当前暂存区 diff', icon: Code },
  { key: 'readme', label: '包说明文档', description: '注入 packages/ai/AGENTS.md', icon: Books }
]

const eventLog = ref('')
const addedAttachments = ref<ChatAttachment[]>([])
const customSelected = ref('')

const handlePickFiles = (files: File[]) => {
  eventLog.value = `pick-files：选中 ${files.map((f) => f.name).join('、')}`
}

const handleAddAttachments = (attachments: ChatAttachment[]) => {
  addedAttachments.value = [...addedAttachments.value, ...attachments]
  message.success(`已读取 ${attachments.length} 个附件`)
}

const handleSelect = (item: AiContextPickerItem) => {
  eventLog.value = `select：选择了「${item.label}」（key=${item.key}）`
  message.info(`已选择上下文：${item.label}`)
}

const handleCustomSelect = (item: AiContextPickerItem) => {
  customSelected.value = `${item.label}（${item.key}）`
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
.demo-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-log {
  margin-top: 12px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.demo-attachments {
  margin-top: 12px;
}
</style>
