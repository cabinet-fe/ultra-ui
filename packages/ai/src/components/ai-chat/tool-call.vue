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
      <span :class="[cls.e('tool-call-name'), isActive && 'u-shine']">{{ toolTitle }}</span>
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
    <!-- 自定义渲染：meta.render / tool-<name> 插槽优先于通用工具视图 -->
    <component :is="tool.render" v-else-if="tool?.render" :tool-call="toolCall" />
    <component :is="slotBody" v-else-if="slotBody && hasResult" />
    <template v-else>
      <ToolData
        v-if="showParamsSection"
        title="参数"
        :node="argumentNode"
        :raw="toolCall.arguments"
      />
      <ToolData
        v-if="resultSectionVisible"
        :title="resultTitle"
        :node="displayResultNode"
        :raw="resultRaw"
        :tone="toolCall.status === 'error' ? 'error' : 'default'"
      />
      <ToolData v-if="viewNode" title="视图" :node="viewNode" :raw="viewRaw" />
    </template>
  </UCollapseItem>
</template>

<script lang="ts" setup>
import { UButton, UCollapseItem, UIcon } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { AiChatDIKey } from './di'
import { isSettledStatus, nodeOf, toolNeedsInteraction, useToolCallBrief } from './tool-call-brief'
import ToolData from './tool-data.vue'
import {
  dropEchoedFields,
  isSummarizedInHeader,
  toToolNode,
  unwrapSingleValue
} from './tool-format'

defineOptions({ name: 'UAiChatToolCall' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const emit = defineEmits<{ (e: 'respond', approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 头部摘要共用视图模型（图标/标题/摘要/状态色），与步骤行共享 */
const { tool, isActive, statusClass, headerIcon, toolTitle, parsedArguments, summary } =
  useToolCallBrief(() => props.toolCall)

const isExpanded = ref(false)
/** 用户手动切换过后，不再随 status 自动展开/折叠 */
let userToggled: boolean = false

/** UCollapseItem 的 change 仅在用户点击头部时触发（程序化 v-model 变更不触发） */
const markUserToggled = () => {
  userToggled = true
}

/** 面板工具：render 展示在右侧侧边面板，卡片 body 仅保留「查看面板」入口 */
const isPanelTool = computed(() => tool.value?.renderTo === 'panel')

/** 「UI 即答复」的终结工具（session 元信息无 terminal，恒为 false） */
const isAnswerTool = computed(() => {
  const t = tool.value
  return !!(t && 'terminal' in t && t.terminal)
})

/** 完成后是否自动折叠：缺省一律折叠；「UI 即答复」的终结工具缺省保持展开 */
const autoCollapse = computed(() => tool.value?.autoCollapse ?? !isAnswerTool.value)

/** 参数区：结构化字段视图，原始串留作降级入口 */
const argumentNode = computed(() => nodeOf(props.toolCall.arguments))

/** 单标量参数已被头部摘要逐字覆盖，body 再列「参数」纯属重复，直接省去该区 */
const showParamsSection = computed(() => {
  const node = argumentNode.value
  return !!node && !isSummarizedInHeader(node)
})

const hasResult = computed(() => {
  return props.toolCall.result != null || props.toolCall.error != null
})

const resultTitle = computed(() => (props.toolCall.status === 'error' ? '错误' : '结果'))

const resultRaw = computed(() => props.toolCall.error ?? props.toolCall.result)

/**
 * 结果展示管线：先剔除回显入参的字段（工具结果复述参数不携带新信息），
 * 剩下单个通用键的标量时直出值本身（如 `{result: 5888}` → `5,888`）。
 */
const displayResultNode = computed(() => {
  const node = nodeOf(resultRaw.value)
  if (!node) return undefined
  return unwrapSingleValue(dropEchoedFields(node, parsedArguments.value))
})

/** 结果全部是入参回显 / 空内容时没有可展示的东西，整区省去 */
const resultSectionVisible = computed(
  () => displayResultNode.value != null && displayResultNode.value.type !== 'empty'
)

/** 服务端下发的 view，格式化为结构化视图；不得丢弃、不得 throw */
const viewRaw = computed(() => {
  const view = props.toolCall.view
  if (view == null) return undefined
  if (typeof view === 'string') return view
  try {
    return JSON.stringify(view, null, 2)
  } catch {
    return String(view)
  }
})

const viewNode = computed(() => {
  const view = props.toolCall.view
  return view == null ? undefined : toToolNode(view)
})

/** 使用方通过 tool-<name> 插槽自定义该工具的展示（有结果时替换整个 body） */
const slotBody = computed(() => {
  const slot = di?.slots[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})

/** 需要用户交互/展示的进行中状态：待确认（有 body 可看时）、有内联自定义 body（提问表单等） */
const needsInteraction = computed(() => toolNeedsInteraction(props.toolCall, di))

/** 终态（成功/失败/拒绝） */
const isSettled = computed(() => isSettledStatus(props.toolCall.status))

// 默认折叠（含进行中）；仅交互/答复类自动展开，用户手动切换过后不再自动变化
watch(
  () => props.toolCall.status,
  (status) => {
    if (userToggled) return
    if (isSettledStatus(status)) {
      isExpanded.value = !autoCollapse.value
    } else {
      isExpanded.value = needsInteraction.value
    }
  },
  { immediate: true }
)

/** 折叠后卸载内容 DOM：仅终态且非面板工具时启用——
 * 进行中/待确认要保留内容状态（确认按钮、表单），面板工具的 body 是「查看面板」入口必须可达 */
const destroyOnCollapse = computed(() => isSettled.value && !isPanelTool.value)
</script>
