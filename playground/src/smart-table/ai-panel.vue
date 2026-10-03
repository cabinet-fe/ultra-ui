<template>
  <div class="smart-table__panel">
    <div class="smart-table__panel-row">
      <u-segment v-model="state.mode" :items="modeItems" />
      <u-select
        v-model="state.targetFieldId"
        :options="targetOptions"
        :clearable="false"
        class="smart-table__panel-target"
      />
      <u-input
        v-if="state.targetFieldId === NEW_FIELD"
        v-model="state.newFieldName"
        placeholder="新字段名称"
        class="smart-table__panel-new"
      />
      <u-button
        type="primary"
        :loading="state.running"
        class="smart-table__panel-run"
        @click="emit('run')"
      >
        {{ state.mode === 'generate' ? 'AI 生成' : 'AI 整理' }}
      </u-button>
    </div>
    <u-textarea
      v-model="state.instruction"
      :rows="2"
      :placeholder="instructionPlaceholder"
      class="smart-table__panel-instruction"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { NEW_FIELD, type AiPanelState } from './use-smart-ai'

/**
 * AI 面板：操作类型（生成 / 整理）+ 目标字段（已有字段或新建文本字段）+
 * 指令输入与触发按钮。表单草稿 `state` 由 `useSmartAi` 持有并直传，请求逻辑在父级 `run`。
 */
const props = defineProps<{
  state: AiPanelState
  targetOptions: { label: string; value: string }[]
}>()

const emit = defineEmits<{ run: [] }>()

const modeItems = [
  { label: 'AI 生成', value: 'generate' },
  { label: 'AI 整理', value: 'organize' }
]

const instructionPlaceholder = computed(() =>
  props.state.mode === 'generate'
    ? '生成指令，如：为每行生成一句 10 字以内的风险提示'
    : '整理指令，如：去掉负责人姓名中的多余空格，统一为先姓后名'
)
</script>

<style lang="scss" scoped>
.smart-table__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 8px;
  background: var(--u-bg-color-top);
}

.smart-table__panel-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.smart-table__panel-target {
  width: 220px;
}

.smart-table__panel-new {
  width: 160px;
}

.smart-table__panel-run {
  flex: none;
}
</style>
