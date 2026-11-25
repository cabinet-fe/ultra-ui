<template>
  <div>
    <CustomCard title="独立消息列表（含圆点导航、吉祥物工作栏与方法调用）">
      <div class="demo-controls">
        <label class="demo-toggle">
          <span>生成中 (running)</span>
          <USwitch v-model="running" />
        </label>
        <label class="demo-toggle">
          <span>只读 (readonly)</span>
          <USwitch v-model="readonly" />
        </label>
        <label class="demo-toggle">
          <span>欢迎栏 (show-welcome)</span>
          <USwitch v-model="showWelcome" />
        </label>
        <label class="demo-toggle">
          <span>圆点导航 (show-navigator)</span>
          <USwitch v-model="showNavigator" />
        </label>
        <UButton size="small" plain @click="listRef?.jumpToTurn('turn-1')">跳至第 1 轮</UButton>
        <UButton size="small" plain @click="listRef?.scrollToLatest()">滚至最新</UButton>
      </div>

      <div class="list-stage">
        <UAiMessageList
          ref="listRef"
          :messages="messages"
          :tools="tools"
          :welcome="welcomePrompts"
          :running="running"
          :readonly="readonly"
          :show-welcome="showWelcome"
          :show-navigator="showNavigator"
          @welcome-click="handleWelcomeClick"
          @respond="handleRespond"
          @regenerate="() => message.info('已触发 regenerate 事件')"
          @open-panel="(id) => message.info(`已触发 open-panel：${id}`)"
          @preview-image="openPreview"
        />
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
  type AiMessageListExposed,
  type ChatMessage,
  type ChatToolMeta,
  UAiMessageList
} from '@veltra/ai'
import { UButton, UImagePreviewer, USwitch, message } from '@veltra/desktop'
import { Monitor, Search } from '@veltra/icons/normal'
import { ref, shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import { createSampleImageAttachment } from '../demo-attachments'

const listRef = useTemplateRef<AiMessageListExposed>('listRef')
const running = ref(false)
const readonly = ref(false)
const showWelcome = ref(true)
const showNavigator = ref(true)

const tools: ChatToolMeta[] = [
  { name: 'searchDocs', label: '检索文档', icon: Search },
  { name: 'openAdminPage', label: '打开后台页面', icon: Monitor, renderTo: 'panel' }
]

const welcomePrompts = ['总结 @veltra/ai 独立组件清单', '如何脱离 UAiChat 监听 open-panel 事件？']

const messages = ref<ChatMessage[]>([
  {
    id: 'turn-1',
    role: 'user',
    content: '帮我查看这张架构图并说明独立组件的样式引入方式。',
    attachments: [createSampleImageAttachment('blue')]
  },
  {
    id: 'a-1',
    role: 'assistant',
    status: 'done',
    reasoning: '定位 @veltra/ai 的 exports 与 sideEffects 规则…',
    content:
      '只需按需导入组件（如 `import { UAiMessageList } from "@veltra/ai"`），组件内置 `import "./style"` 会随构建自动打包样式。',
    toolCalls: [
      {
        id: 'tc-1',
        name: 'searchDocs',
        arguments: '{"query":"sideEffects style.ts"}',
        status: 'success',
        result: '{"matched":true}'
      }
    ]
  },
  { id: 'turn-2', role: 'user', content: '如果工具设置了 renderTo: "panel"，列表内会怎么展示？' },
  {
    id: 'a-2',
    role: 'assistant',
    status: 'done',
    content: '步骤卡片内会保留「查看面板」入口按钮，点击后向外触发 `open-panel(toolCallId)` 事件。',
    toolCalls: [
      {
        id: 'tc-2',
        name: 'openAdminPage',
        arguments: '{"page":"order-list"}',
        status: 'success',
        result: '{"opened":true}'
      }
    ]
  },
  { id: 'turn-3', role: 'user', content: '列表高度和会话圆点导航如何配合？' },
  {
    id: 'a-3',
    role: 'assistant',
    status: 'done',
    content:
      '外层容器提供明确高度后，当轮次数不少于 3 且可滚动时，左侧会自动呈现 `UAiSessionNav` 圆点导航。'
  }
])

let nextSeq = 4

const handleWelcomeClick = (prompt: string) => {
  const id = `turn-${nextSeq++}`
  messages.value = [
    ...messages.value,
    { id, role: 'user', content: prompt },
    {
      id: `a-${id}`,
      role: 'assistant',
      status: 'done',
      content: `已收到快速提问：**${prompt}**。可通过 \`@welcome-click\` 接入实际对话逻辑。`
    }
  ]
}

const handleRespond = (toolCallId: string, approved: boolean) => {
  message[approved ? 'success' : 'info'](`工具 ${toolCallId} ${approved ? '已允许' : '已拒绝'}`)
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

.list-stage {
  height: 460px;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-large);
  background-color: var(--u-bg-color-bottom);
  overflow: hidden;
}
</style>
