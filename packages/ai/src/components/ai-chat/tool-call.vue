<template>
  <div :class="[cls.e('tool-call'), bem.is(toolCall.status), bem.is('expanded', isExpanded)]">
    <UCollapseItem v-model="isExpanded" @change="markUserToggled">
      <template #title>
        <UIcon :class="[cls.e('tool-call-status'), statusClass]">
          <component :is="headerIcon" />
        </UIcon>
        <span :class="cls.e('tool-call-name')">{{ tool?.label ?? toolCall.name }}</span>
        <span v-if="summary" :class="cls.e('tool-call-summary')">{{ summary }}</span>

        <span
          v-if="toolCall.status === 'awaiting-confirm'"
          :class="cls.e('tool-call-confirm')"
          @click.stop
        >
          <UButton size="small" type="primary" @click="emit('respond', true)">允许</UButton>
          <UButton size="small" text @click="emit('respond', false)">拒绝</UButton>
        </span>
      </template>

      <!-- 自定义渲染：工具定义的 render 优先于 tool-<name> 插槽，均替换整个 body -->
      <component :is="tool?.render" v-if="tool?.render" :tool-call="toolCall" />
      <component :is="slotBody" v-else-if="slotBody && hasResult" />
      <template v-else>
        <template v-if="prettyArguments">
          <div :class="cls.e('tool-call-section')">参数</div>
          <pre :class="cls.e('tool-call-code')">{{ prettyArguments }}</pre>
        </template>

        <template v-if="hasResult">
          <div :class="cls.e('tool-call-section')">
            {{ toolCall.status === 'error' ? '错误' : '结果' }}
          </div>
          <pre :class="cls.e('tool-call-code')">{{ displayResult }}</pre>
        </template>
      </template>
    </UCollapseItem>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UCollapseItem, UIcon } from '@veltra/desktop'
import '@veltra/desktop/components/collapse/style'
import { CircleCheckFilled, CircleClose, Close, Loading, WarningFilled } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch, type Component } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatToolCall' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const emit = defineEmits<{ (e: 'respond', approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 当前调用对应的工具定义（解析 icon/label/render/autoCollapse） */
const tool = computed(() => di?.tools.value[props.toolCall.name])

const isExpanded = ref(false)
/** 用户手动切换过后，不再随 status 自动展开/折叠 */
let userToggled: boolean = false

function markUserToggled() {
  userToggled = true
}

/** 完成后是否自动折叠：缺省有 render 时不折叠，否则折叠 */
const autoCollapse = computed(() => tool.value?.autoCollapse ?? !tool.value?.render)

watch(
  () => props.toolCall.status,
  (status) => {
    if (userToggled) return
    if (status === 'running' || status === 'awaiting-confirm') {
      isExpanded.value = true
    } else {
      isExpanded.value = !autoCollapse.value
    }
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

/** 头部图标：工具自定义图标优先，缺省用状态图标 */
const headerIcon = computed(() => tool.value?.icon ?? statusIcon.value)

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

/** 使用方通过 tool-<name> 插槽自定义该工具的展示（有结果时替换整个 body） */
const slotBody = computed(() => {
  const slot = di?.slots[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})
</script>
