<template>
  <div :class="cls.e('group')">
    <!-- AND/OR 标签 + 汇总结果 -->
    <div :class="cls.e('group-header')">
      <span :class="[cls.e('logic-tag'), cls.em('logic-tag', group.logic)]" @click="toggleLogic">
        {{ group.logic.toUpperCase() }} ▾
      </span>
      <span
        v-if="hasResult"
        :class="[cls.e('group-result'), cls.em('group-result', group._result ? 'pass' : 'fail')]"
      >
        {{ group._result ? '✓ 通过' : '✗ 不通过' }}
      </span>
    </div>

    <!-- 嵌套组容器 -->
    <div :class="cls.e('group-body')">
      <!-- 子条件 -->
      <ConditionRow
        v-for="(cond, idx) in group.conditions"
        :key="idx"
        :item="cond"
        :fields="fields"
        :size="size"
        :disabled="disabled"
        :readonly="readonly"
        @update:item="(item) => updateCondition(idx, item)"
        @delete="removeCondition(idx)"
        @mention="(p) => emit('mention', p)"
      />

      <!-- 子分组（递归） -->
      <ConditionGroup
        v-for="(sub, idx) in group.groups"
        :key="idx"
        :group="sub"
        :fields="fields"
        :size="size"
        :disabled="disabled"
        :readonly="readonly"
        @update:group="(g) => updateSubGroup(idx, g)"
        @remove="() => removeSubGroup(idx)"
        @mention="(p) => emit('mention', p)"
      />

      <!-- 空状态 + 添加按钮 -->
      <div :class="cls.e('group-actions')">
        <span v-if="!readonly" :class="cls.e('add-btn')" @click="addCondition">＋ 添加条件</span>
        <span v-if="!readonly" :class="cls.e('add-btn')" @click="addGroup">＋ 添加条件组</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ConditionField, ConditionGroup, ConditionItem } from '../../../types'
import { createEmptyGroup, createEmptyItem } from '../core/evaluator'
import ConditionRow, { type MentionPayload } from './condition-row.vue'

defineOptions({ name: 'ConditionGroup' })

const props = withDefaults(
  defineProps<{
    group: ConditionGroup
    fields?: ConditionField[]
    size?: 'small' | 'default' | 'large'
    disabled?: boolean
    readonly?: boolean
  }>(),
  { size: 'default' }
)

const emit = defineEmits<{
  (e: 'update:group', group: ConditionGroup): void
  (e: 'remove'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

const hasResult = computed(() => props.group._result !== undefined)

function toggleLogic() {
  if (props.disabled || props.readonly) return
  emit('update:group', {
    ...props.group,
    logic: props.group.logic === 'and' ? 'or' : 'and'
  })
}

function addCondition() {
  emit('update:group', {
    ...props.group,
    conditions: [...props.group.conditions, createEmptyItem()]
  })
}

function removeCondition(idx: number) {
  const conditions = [...props.group.conditions]
  conditions.splice(idx, 1)
  emit('update:group', { ...props.group, conditions })
}

function updateCondition(idx: number, item: ConditionItem) {
  const conditions = [...props.group.conditions]
  conditions[idx] = item
  emit('update:group', { ...props.group, conditions })
}

function addGroup() {
  emit('update:group', {
    ...props.group,
    groups: [...props.group.groups, createEmptyGroup()]
  })
}

function removeSubGroup(idx: number) {
  const groups = [...props.group.groups]
  groups.splice(idx, 1)
  emit('update:group', { ...props.group, groups })
}

function updateSubGroup(idx: number, g: ConditionGroup) {
  const groups = [...props.group.groups]
  groups[idx] = g
  emit('update:group', { ...props.group, groups })
}
</script>
