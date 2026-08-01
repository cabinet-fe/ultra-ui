<template>
  <div :class="[cls.e('tool-call'), bem.is('expanded', expanded), bem.is(toolCall.status)]">
    <div :class="cls.e('tool-call-header')" @click="handleToggle">
      <UIcon :class="[cls.e('tool-call-status'), statusClass]">
        <component :is="statusIcon" />
      </UIcon>
      <span :class="cls.e('tool-call-name')">{{ toolCall.name }}</span>
      <span v-if="summary" :class="cls.e('tool-call-summary')">{{ summary }}</span>

      <span
        v-if="toolCall.status === 'awaiting-confirm'"
        :class="cls.e('tool-call-confirm')"
        @click.stop
      >
        <UButton size="small" type="primary" @click="emit('respond', true)">允许</UButton>
        <UButton size="small" text @click="emit('respond', false)">拒绝</UButton>
      </span>

      <UIcon :class="cls.e('tool-call-chevron')"><ArrowDown /></UIcon>
    </div>

    <div v-if="expanded" :class="cls.e('tool-call-body')">
      <template v-if="prettyArguments">
        <div :class="cls.e('tool-call-section')">参数</div>
        <pre :class="cls.e('tool-call-code')">{{ prettyArguments }}</pre>
      </template>

      <template v-if="hasResult">
        <div :class="cls.e('tool-call-section')">
          {{ toolCall.status === 'error' ? '错误' : '结果' }}
        </div>
        <component :is="customResult" v-if="customResult" />
        <pre v-else :class="cls.e('tool-call-code')">{{ displayResult }}</pre>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UIcon } from '@veltra/desktop'
import {
  ArrowDown,
  CircleCheckFilled,
  CircleClose,
  Close,
  Loading,
  WarningFilled
} from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch, type Component } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatToolCall' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const emit = defineEmits<{ (e: 'respond', approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 用户手动切换后不再跟随状态自动展开/折叠 */
const expanded = ref(false)
let userToggled = false

const handleToggle = () => {
  userToggled = true
  expanded.value = !expanded.value
}

watch(
  () => props.toolCall.status,
  (status) => {
    if (userToggled) return
    expanded.value = status === 'running' || status === 'awaiting-confirm'
  },
  { immediate: true }
)

const STATUS_META: Record<string, { icon: Component; class: string }> = {
  pending: { icon: Loading, class: 'is-loading' },
  running: { icon: Loading, class: 'is-loading' },
  'awaiting-confirm': { icon: WarningFilled, class: 'is-warning' },
  success: { icon: CircleCheckFilled, class: 'is-success' },
  error: { icon: CircleClose, class: 'is-danger' },
  rejected: { icon: Close, class: 'is-danger' }
}

const statusIcon = computed(() => STATUS_META[props.toolCall.status]?.icon ?? Loading)
const statusClass = computed(() => STATUS_META[props.toolCall.status]?.class ?? '')

const parsedArguments = computed<Record<string, unknown> | null>(() => {
  if (!props.toolCall.arguments) return null
  try {
    return JSON.parse(props.toolCall.arguments)
  } catch {
    return null
  }
})

/** 折叠态参数摘要：取第一个字符串参数值 */
const summary = computed(() => {
  const args = parsedArguments.value
  if (!args) return ''
  for (const value of Object.values(args)) {
    if (typeof value === 'string' && value) {
      return value.length > 40 ? `${value.slice(0, 40)}…` : value
    }
  }
  return ''
})

const prettyArguments = computed(() => {
  const args = parsedArguments.value
  if (args) return JSON.stringify(args, null, 2)
  return props.toolCall.arguments || ''
})

const hasResult = computed(() => {
  return props.toolCall.result != null || props.toolCall.error != null
})

const displayResult = computed(() => {
  const raw = props.toolCall.error ?? props.toolCall.result ?? ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
})

/** 使用方通过 tool-<name> 插槽自定义该工具的结果展示 */
const customResult = computed(() => {
  const slot = di?.slots[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})
</script>
