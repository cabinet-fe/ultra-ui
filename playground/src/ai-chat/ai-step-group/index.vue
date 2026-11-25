<template>
  <div>
    <CustomCard title="已完成的多步骤过程行（默认折叠）">
      <UAiStepGroup :steps="settledSteps" :tools="demoTools" />
    </CustomCard>

    <CustomCard title="进行中与待确认自动展开 (live)">
      <div class="demo-actions">
        <UButton size="small" plain @click="resetLiveSteps">重置待确认状态</UButton>
        <span class="demo-hint">包含 awaiting-confirm 工具步时，live 模式自动展开步骤列表</span>
      </div>
      <UAiStepGroup
        :steps="liveSteps"
        :tools="demoTools"
        live
        @respond="handleRespond"
        @open-panel="(id) => message.info(`打开侧边面板：${id}`)"
      />
    </CustomCard>

    <CustomCard title="异常与中止终态 (end-status)">
      <div class="group-stack">
        <UAiStepGroup :steps="settledSteps" :tools="demoTools" end-status="error" />
        <UAiStepGroup :steps="settledSteps" :tools="demoTools" end-status="aborted" />
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type AiStepItem, type ChatMessage, type ChatToolMeta, UAiStepGroup } from '@veltra/ai'
import { UButton, message } from '@veltra/desktop'
import { Delete, Monitor, Search } from '@veltra/icons/normal'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const demoTools: ChatToolMeta[] = [
  { name: 'searchDocs', label: '检索文档', icon: Search },
  { name: 'deleteFile', label: '删除文件', icon: Delete },
  { name: 'openAdmin', label: '打开后台面板', icon: Monitor, renderTo: 'panel' }
]

const settledSource: ChatMessage = {
  id: 'm-settled',
  role: 'assistant',
  status: 'done',
  reasoning: '先检索组件导出边界，再确认面板配置参数。',
  content: '已完成检查。'
}

const settledSteps: AiStepItem[] = [
  { key: 's-reason', kind: 'reasoning', message: settledSource },
  {
    key: 's-tool-1',
    kind: 'tool',
    message: settledSource,
    toolCall: {
      id: 'call-search',
      name: 'searchDocs',
      arguments: '{"query":"UAiStepGroup props"}',
      status: 'success',
      result: '{"hits":4}'
    }
  },
  {
    key: 's-tool-2',
    kind: 'tool',
    message: settledSource,
    toolCall: {
      id: 'call-panel',
      name: 'openAdmin',
      arguments: '{"page":"user-form"}',
      status: 'success',
      result: '{"opened":true}'
    }
  }
]

const createLiveSteps = (): AiStepItem[] => {
  const msg: ChatMessage = {
    id: 'm-live',
    role: 'assistant',
    status: 'streaming',
    reasoning: '准备清理过期缓存文件…',
    content: ''
  }
  return [
    { key: 'l-reason', kind: 'reasoning', message: msg },
    {
      key: 'l-tool',
      kind: 'tool',
      message: msg,
      toolCall: {
        id: 'call-confirm',
        name: 'deleteFile',
        arguments: '{"path":"/tmp/stale-cache.json"}',
        status: 'awaiting-confirm'
      }
    }
  ]
}

const liveSteps = ref<AiStepItem[]>(createLiveSteps())

const handleRespond = (toolCallId: string, approved: boolean) => {
  liveSteps.value = liveSteps.value.map((step) => {
    if (step.toolCall?.id !== toolCallId) return step
    return {
      ...step,
      toolCall: {
        ...step.toolCall,
        status: approved ? 'success' : 'rejected',
        result: approved ? '{"deleted":"/tmp/stale-cache.json"}' : undefined
      }
    }
  })
  message[approved ? 'success' : 'info'](approved ? '已允许执行' : '已拒绝执行')
}

const resetLiveSteps = () => {
  liveSteps.value = createLiveSteps()
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

.group-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
