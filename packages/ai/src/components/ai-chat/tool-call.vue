<template>
  <UCollapseItem
    v-model="isExpanded"
    :class="[cls.e('tool-call'), bem.is(toolCall.status)]"
    :destroy-on-collapse="destroyOnCollapse"
    @change="markUserToggled"
  >
    <template #header>
      <UIcon :class="[cls.e('tool-call-status'), statusClass]">
        <component :is="headerIcon" />
      </UIcon>
      <span :class="[cls.e('tool-call-name'), isActive && 'u-shine']">
        {{ tool?.label ?? toolCall.name }}
      </span>
      <span v-if="summary" :class="cls.e('tool-call-summary')">{{ summary }}</span>

      <span
        v-if="toolCall.status === 'awaiting-confirm'"
        :class="cls.e('tool-call-confirm')"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        <UButton size="small" type="primary" @click="emit('respond', true)">允许</UButton>
        <UButton size="small" text @click="emit('respond', false)">拒绝</UButton>
      </span>
    </template>

    <!-- 面板工具：render 展示在右侧侧边面板，卡片 body 仅提供查看入口 -->
    <div v-if="isPanelTool" :class="cls.e('tool-call-panel-entry')">
      <span :class="cls.e('tool-call-panel-hint')">内容展示在右侧面板</span>
      <UButton size="small" text type="primary" @click="di?.openPanel(toolCall.id)">
        查看面板
      </UButton>
    </div>
    <!-- 自定义渲染：工具定义的 render 优先于 tool-<name> 插槽，均替换整个 body -->
    <component :is="tool.render" v-else-if="tool?.render" :tool-call="toolCall" />
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
</template>

<script lang="ts" setup>
import { UButton, UCollapseItem, UIcon } from '@veltra/desktop'
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

/** 当前调用对应的工具定义（解析 icon/label/render/autoCollapse/terminal） */
const tool = computed(() => di?.tools.value[props.toolCall.name])

const isExpanded = ref(false)
/** 用户手动切换过后，不再随 status 自动展开/折叠 */
let userToggled: boolean = false

/** UCollapseItem 的 change 仅在用户点击头部时触发（程序化 v-model 变更不触发） */
const markUserToggled = () => {
  userToggled = true
}

/** 面板工具：render 展示在右侧侧边面板，卡片 body 仅保留「查看面板」入口 */
const isPanelTool = computed(() => tool.value?.renderTo === 'panel')

/** 完成后是否自动折叠：缺省面板工具折叠；有 render 时不折叠，否则折叠 */
const autoCollapse = computed(
  () => tool.value?.autoCollapse ?? (isPanelTool.value || !tool.value?.render)
)

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
  pending: { icon: Loading, class: 'is-active' },
  running: { icon: Loading, class: 'is-active' },
  'awaiting-confirm': { icon: WarningFilled, class: 'is-warning' },
  success: { icon: CircleCheckFilled, class: 'is-success' },
  error: { icon: CircleClose, class: 'is-danger' },
  rejected: { icon: Close, class: 'is-danger' }
}

const statusIcon = computed(() => STATUS_META[props.toolCall.status]?.icon ?? Loading)
const statusClass = computed(() => STATUS_META[props.toolCall.status]?.class ?? '')

/** 进行中（pending/running）：工具名带扫光效果 */
const isActive = computed(() => {
  return props.toolCall.status === 'pending' || props.toolCall.status === 'running'
})

/** 终态（成功/失败/拒绝） */
const isSettled = computed(() => {
  return ['success', 'error', 'rejected'].includes(props.toolCall.status)
})

/**
 * 折叠后卸载内容 DOM：仅终态且非面板工具时启用——
 * 进行中/待确认要保留内容状态（确认按钮、表单），面板工具的 body 是「查看面板」入口必须可达
 */
const destroyOnCollapse = computed(() => isSettled.value && !isPanelTool.value)

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
