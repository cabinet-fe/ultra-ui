<template>
  <div>
    <CustomCard title="推理等级选择（4 档）">
      <div class="demo-row">
        <UAiReasoningPicker
          v-model="level"
          :levels="levels"
          direction="bottom"
          alignment="start"
          @change="handleChange"
        />
        <span class="demo-hint">当前等级：{{ level ?? '未选择' }}</span>
      </div>
      <div v-if="changeLog" class="demo-log">{{ changeLog }}</div>
    </CustomCard>

    <CustomCard title="占位文案、禁用态与单档自动隐藏">
      <div class="demo-row">
        <UAiReasoningPicker
          v-model="unsetLevel"
          :levels="levels"
          placeholder="选择思考深度"
          direction="bottom"
          alignment="start"
        />
        <UAiReasoningPicker
          v-model="level"
          :levels="levels"
          disabled
          direction="bottom"
          alignment="start"
        />
        <div class="demo-single-box">
          <span>单档位（levels.length === 1）不渲染：</span>
          <UAiReasoningPicker :levels="[{ value: 'default', label: '默认' }]" />
          <span class="demo-tag">（此处无触发器 DOM）</span>
        </div>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatReasoningLevel, UAiReasoningPicker } from '@veltra/ai'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const levels: ChatReasoningLevel[] = [
  { value: 'low', label: '快速' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '深度' },
  { value: 'max', label: '极致' }
]

const level = ref<string | undefined>('high')
const unsetLevel = ref<string | undefined>(undefined)
const changeLog = ref('')

const handleChange = (value: string, item: ChatReasoningLevel) => {
  changeLog.value = `change：切换为「${item.label}」（${value}）`
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

.demo-single-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.demo-tag {
  color: var(--u-text-color-assist);
}
</style>
