<template>
  <div :class="[cls.e('group'), depth > 0 ? cls.em('group', 'nested') : '']">
    <template v-if="group.children.length === 0">
      <div :class="cls.e('group-empty')">
        <span :class="cls.e('group-empty-tip')">暂无条件</span>
      </div>
    </template>

    <ul :class="cls.e('group-list')">
      <li v-for="(child, idx) in group.children" :key="idx" :class="cls.e('group-item')">
        <span
          v-if="idx > 0"
          :class="[cls.e('connector'), cls.em('connector', connectorAt(idx - 1))]"
          :tabindex="readonly || disabled ? -1 : 0"
          role="button"
          :aria-label="`切换连接符（当前 ${connectorAt(idx - 1).toUpperCase()}）`"
          @click="toggleConnector(idx - 1)"
          @keydown.enter.prevent="toggleConnector(idx - 1)"
          @keydown.space.prevent="toggleConnector(idx - 1)"
          >{{ connectorAt(idx - 1).toUpperCase() }}</span
        >
        <span v-else :class="cls.e('connector-placeholder')">WHERE</span>

        <div :class="cls.e('group-item-body')">
          <ConditionRow
            v-if="child.type === 'condition'"
            :item="child"
            :fields="fields"
            :size="size"
            :disabled="disabled"
            :readonly="readonly"
            @update:item="(it) => updateChild(idx, it)"
            @delete="removeChild(idx)"
            @mention="(p) => emit('mention', p)"
          />
          <ConditionGroup
            v-else
            :group="child"
            :fields="fields"
            :size="size"
            :depth="depth + 1"
            :disabled="disabled"
            :readonly="readonly"
            @update:group="(g) => updateChild(idx, g)"
            @remove="removeChild(idx)"
            @mention="(p) => emit('mention', p)"
          />
        </div>
      </li>
    </ul>

    <div v-if="!readonly" :class="cls.e('group-actions')">
      <button type="button" :class="cls.e('action-btn')" :disabled="disabled" @click="addCondition">
        <u-icon><Plus /></u-icon>
        <span>添加条件</span>
      </button>
      <button type="button" :class="cls.e('action-btn')" :disabled="disabled" @click="addGroup">
        <u-icon><Plus /></u-icon>
        <span>添加条件组</span>
      </button>
      <button
        v-if="depth > 0"
        type="button"
        :class="[cls.e('action-btn'), cls.em('action-btn', 'danger')]"
        :disabled="disabled"
        @click="emit('remove')"
      >
        <u-icon><Delete /></u-icon>
        <span>删除组</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Delete, Plus } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type {
  ConditionConnector,
  ConditionField,
  ConditionGroup as ConditionGroupNode,
  ConditionNode
} from '../../../types'
import { UIcon } from '../../icon'
import { createEmptyGroup, createEmptyLeaf } from '../core/evaluator'
import ConditionRow, { type MentionPayload } from './condition-row.vue'

defineOptions({ name: 'ConditionGroup' })

const props = withDefaults(
  defineProps<{
    group: ConditionGroupNode
    fields?: ConditionField[]
    size?: 'small' | 'default' | 'large'
    depth?: number
    disabled?: boolean
    readonly?: boolean
  }>(),
  { size: 'default', depth: 0 }
)

const emit = defineEmits<{
  (e: 'update:group', group: ConditionGroupNode): void
  (e: 'remove'): void
  (e: 'mention', payload: MentionPayload): void
}>()

const cls = bem('condition-editor')

function connectorAt(index: number): ConditionConnector {
  return props.group.connectors[index] ?? 'and'
}

function emitUpdate(next: Partial<ConditionGroupNode>) {
  emit('update:group', { ...props.group, ...next })
}

function toggleConnector(index: number) {
  if (props.disabled || props.readonly) return
  const next = props.group.connectors.slice()
  next[index] = connectorAt(index) === 'and' ? 'or' : 'and'
  emitUpdate({ connectors: next })
}

function addCondition() {
  appendChild(createEmptyLeaf())
}

function addGroup() {
  appendChild({ ...createEmptyGroup(), children: [createEmptyLeaf()], connectors: [] })
}

function appendChild(node: ConditionNode) {
  const children = [...props.group.children, node]
  const connectors =
    props.group.children.length === 0
      ? props.group.connectors
      : [...props.group.connectors, 'and' as const]
  emitUpdate({ children, connectors })
}

function updateChild(index: number, node: ConditionNode) {
  const children = props.group.children.slice()
  children[index] = node
  emitUpdate({ children })
}

function removeChild(index: number) {
  const children = props.group.children.slice()
  children.splice(index, 1)
  const connectors = props.group.connectors.slice()
  // 移除第 index 项时，连接到该项的连接符也要移除
  // connectors[i] 位于 children[i] 与 children[i+1] 之间
  if (index === 0) {
    if (connectors.length > 0) connectors.shift()
  } else {
    connectors.splice(index - 1, 1)
  }
  emitUpdate({ children, connectors })
}
</script>
