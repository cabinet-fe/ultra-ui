<template>
  <div>
    <CustomCard title="模型切换（含副标题描述）">
      <div class="demo-row">
        <UAiModelPicker
          v-model="selectedModel"
          :models="models"
          direction="bottom"
          alignment="start"
          @change="handleChange"
        />
        <span class="demo-hint">当前模型 ID：{{ selectedModel ?? '未选择' }}</span>
      </div>
      <div v-if="changeLog" class="demo-log">{{ changeLog }}</div>
    </CustomCard>

    <CustomCard title="占位文案与禁用态">
      <div class="demo-row">
        <UAiModelPicker
          v-model="emptyModel"
          :models="models"
          placeholder="请选择模型"
          direction="bottom"
          alignment="start"
        />
        <UAiModelPicker
          v-model="selectedModel"
          :models="models"
          disabled
          direction="bottom"
          alignment="start"
        />
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatModel, UAiModelPicker } from '@veltra/ai'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const models: ChatModel[] = [
  { id: 'deepseek-chat', label: 'DeepSeek Chat', description: '通用对话与日常编码，响应均衡' },
  {
    id: 'deepseek-reasoner',
    label: 'DeepSeek Reasoner',
    description: '多步深度推理，适合复杂架构与排障'
  },
  { id: 'veltra-flash', label: 'Veltra Flash', description: '极速低延迟模型，适合高频轻量任务' }
]

const selectedModel = ref<string | undefined>('deepseek-chat')
const emptyModel = ref<string | undefined>(undefined)
const changeLog = ref('')

const handleChange = (value: string, model: ChatModel) => {
  changeLog.value = `change：切换为 ${model.label ?? value}（${value}）`
}
</script>

<style scoped lang="scss">
.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-log {
  margin-top: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
