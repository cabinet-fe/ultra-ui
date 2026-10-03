<template>
  <!-- 复选框：展示即编辑，无需进入/退出编辑态 -->
  <u-checkbox v-if="field.type === 'checkbox'" v-model="checkModel" />

  <!-- 只读态：点击进入行内编辑 -->
  <div v-else-if="!active" class="smart-table__cell-display" @click="emit('edit')">
    <template v-if="field.type === 'multi-select'">
      <span v-if="isEmpty" class="smart-table__cell-empty">—</span>
      <u-tag v-for="item in multiModel" :key="item" size="small" class="smart-table__cell-tag">
        {{ item }}
      </u-tag>
    </template>
    <u-progress v-else-if="field.type === 'progress'" :percentage="progressModel" />
    <span v-else-if="isEmpty" class="smart-table__cell-empty">—</span>
    <span v-else class="smart-table__cell-text">{{ model }}</span>
  </div>

  <!-- 编辑态：按字段类型分发编辑器，编辑完成即提交并退出 -->
  <div v-else class="smart-table__cell-editor">
    <u-input
      v-if="field.type === 'text'"
      v-model="textModel"
      placeholder="输入文本"
      @blur="emit('exit')"
    />
    <u-number-input
      v-else-if="field.type === 'number'"
      v-model="numberModel"
      placeholder="输入数字"
      @change="emit('exit')"
    />
    <u-select
      v-else-if="field.type === 'select'"
      v-model="selectModel"
      :options="fieldOptions"
      clearable
      placeholder="选择一项"
      @change="emit('exit')"
    />
    <u-multi-select
      v-else-if="field.type === 'multi-select'"
      v-model="multiModel"
      :options="fieldOptions"
      placeholder="选择多项"
      @change="emit('exit')"
    />
    <u-date-picker
      v-else-if="field.type === 'date'"
      v-model="dateModel"
      type="date"
      placeholder="选择日期"
      @change="emit('exit')"
    />
    <u-slider
      v-else-if="field.type === 'progress'"
      v-model="progressModel"
      :min="0"
      :max="100"
      @pointerup="emit('exit')"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { CellValue, TableField } from './types'

/**
 * 智慧表格单元格：只读态展示 + 按字段类型分发行内编辑器。
 * 值由父级以 v-model 直绑 `row.values[field.id]`，编辑即写入，即时生效。
 */
const props = defineProps<{ field: TableField; active: boolean }>()

const model = defineModel<CellValue>({ required: true })

const emit = defineEmits<{ edit: []; exit: [] }>()

/** 空值判定：缺键（undefined）/ null / 空串 / 空数组均显示为空单元格 */
const isEmpty = computed(
  () =>
    model.value === undefined ||
    model.value === null ||
    model.value === '' ||
    (Array.isArray(model.value) && model.value.length === 0)
)

// 各编辑器组件的 modelValue 不接受 null：以下桥接负责空值双向转换
const textModel = computed({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: (v: string) => {
    model.value = v
  }
})

const numberModel = computed({
  get: () => (typeof model.value === 'number' ? model.value : undefined),
  set: (v?: number) => {
    model.value = v ?? null
  }
})

const selectModel = computed({
  get: () => (typeof model.value === 'string' ? model.value : undefined),
  set: (v?: string) => {
    model.value = v ?? null
  }
})

const multiModel = computed({
  get: () => (Array.isArray(model.value) ? model.value : []),
  set: (v: string[]) => {
    model.value = v
  }
})

const dateModel = computed({
  get: () => (typeof model.value === 'string' ? model.value : undefined),
  set: (v?: string) => {
    model.value = v || null
  }
})

const progressModel = computed({
  get: () => (typeof model.value === 'number' ? model.value : 0),
  set: (v: number) => {
    model.value = v
  }
})

const checkModel = computed({
  get: () => model.value === true,
  set: (v: boolean) => {
    model.value = v
  }
})

/** 单选/多选候选选项：选项值即标签 */
const fieldOptions = computed(() =>
  (props.field.options ?? []).map((o) => ({ label: o, value: o }))
)
</script>

<style lang="scss" scoped>
.smart-table__cell-display {
  min-height: 28px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  cursor: text;
  border-radius: 4px;
  padding: 2px 4px;
  margin: 0 -4px;

  :deep(.u-progress) {
    width: 100%;
  }
}

.smart-table__cell-display:hover {
  background: color-mix(in srgb, var(--u-color-primary) 8%, transparent);
}

.smart-table__cell-empty {
  color: var(--u-text-color-disabled, #c0c4cc);
}

.smart-table__cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--u-text-color-main);
}

.smart-table__cell-tag {
  margin-right: 4px;
}

.smart-table__cell-editor {
  display: flex;
  align-items: center;
  width: 100%;

  :deep(.u-input),
  :deep(.u-number-input),
  :deep(.u-select),
  :deep(.u-multi-select),
  :deep(.u-date-picker) {
    width: 100%;
  }
}
</style>
