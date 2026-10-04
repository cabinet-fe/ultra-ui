<template>
  <aside class="smart-table-chat">
    <div class="smart-table-chat__bar">
      <span class="smart-table-chat__title">AI 对话</span>
      <span class="smart-table-chat__hint">了解当前表格，直接问数据</span>
      <u-button
        class="smart-table-chat__close"
        size="small"
        plain
        circle
        :icon="Close"
        title="关闭"
        @click="emit('close')"
      />
    </div>

    <!-- 模型目录加载失败：面板内给出可读原因（如参考服务未启动），不白屏 -->
    <div v-if="status === 'error'" class="smart-table-chat__fallback">
      <p class="smart-table-chat__fallback-title">AI 对话暂不可用</p>
      <p class="smart-table-chat__fallback-text">{{ loadError }}</p>
    </div>

    <div v-else class="smart-table-chat__body">
      <template v-if="transport">
        <!-- 上游错误（如未配 key 的 503）解析出可读信息，展示在面板顶部；下次发送自动清除 -->
        <div v-if="chatError" class="smart-table-chat__error">
          <span>{{ chatError }}</span>
          <u-button size="small" text type="primary" @click="chatError = ''">知道了</u-button>
        </div>
        <u-ai-chat
          class="smart-table-chat__widget"
          :transport="transport"
          :models="transport.models"
          :system-prompt="contextPrompt"
          :welcome="WELCOME"
          placeholder="问问这张表…"
          @error="onChatError"
          @send="chatError = ''"
        />
      </template>
      <p v-else class="smart-table-chat__fallback-text">AI 模型加载中…</p>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { UAiChat } from '@veltra/ai'
import '@veltra/ai/style'
import { Close } from '@veltra/icons/normal'
import { computed, onMounted, ref } from 'vue'

import { buildTableContextPrompt, createSmartTableChatTransport, readableAiError } from './ai-chat'
import type { TableDoc } from './types'

/**
 * 智慧表格右侧 AI 对话面板：`UAiChat` + 代理端 OpenAI transport（模型目录来自
 * `/smart-table-api/ai/models`，key 留在服务端），表格上下文经 systemPrompt
 * 注入（见 `ai-chat.ts`）。上游/目录错误在面板内以可读信息展示。
 */
const props = defineProps<{ doc: TableDoc | null }>()

const emit = defineEmits<{ close: [] }>()

const WELCOME = [
  '这张表有哪些字段？',
  '这张表现在有几行数据？',
  '各状态的需求分别有几条？',
  '哪些需求还没验收？'
]

const transport = ref<Awaited<ReturnType<typeof createSmartTableChatTransport>> | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const loadError = ref('')

/** 对话请求失败的可读信息（transport 错误文案里抠出代理返回的 message） */
const chatError = ref('')

const contextPrompt = computed(() => buildTableContextPrompt(props.doc))

onMounted(async () => {
  try {
    transport.value = await createSmartTableChatTransport()
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    loadError.value = error instanceof Error ? error.message : '未知错误'
  }
})

function onChatError(error: Error): void {
  chatError.value = readableAiError(error.message)
}
</script>

<style lang="scss" scoped>
.smart-table-chat {
  flex: none;
  display: flex;
  flex-direction: column;
  width: 420px;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid var(--u-border-muted-color, #e4e7ed);
  border-radius: 8px;
  background: var(--u-bg-color-top, #fff);
}

.smart-table-chat__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.smart-table-chat__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.smart-table-chat__hint {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table-chat__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.smart-table-chat__widget {
  flex: 1;
  min-height: 0;
}

.smart-table-chat__fallback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px 12px;
}

.smart-table-chat__fallback-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.smart-table-chat__fallback-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--u-text-color-second);
}

.smart-table-chat__error {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--u-color-danger, #f04438);
  background: var(--u-fill-color, #f2f4f7);

  span {
    flex: 1;
    min-width: 0;
  }
}
</style>
