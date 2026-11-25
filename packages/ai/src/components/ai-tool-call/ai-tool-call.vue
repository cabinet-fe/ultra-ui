<template>
  <UCollapseItem
    v-model="isExpanded"
    :class="[cls.b, bem.is(toolCall.status)]"
    :destroy-on-collapse="destroyOnCollapse"
    @change="markUserToggled"
  >
    <template #header>
      <UIcon :class="[cls.e('status'), statusClass]">
        <component :is="headerIcon" />
      </UIcon>
      <span :class="[cls.e('name'), isActive && 'u-shine']">{{ toolTitle }}</span>
      <span v-if="summary" :class="cls.e('summary')">{{ summary }}</span>
      <slot name="header-extra" :tool-call="toolCall" />
      <span
        v-if="toolCall.status === 'awaiting-confirm'"
        :class="cls.e('confirm')"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        <UButton size="small" type="primary" @click="emit('respond', true)">允许</UButton>
        <UButton size="small" text @click="emit('respond', false)">拒绝</UButton>
      </span>
    </template>

    <slot :tool-call="toolCall">
      <div v-if="isPanelTool" :class="cls.e('panel-entry')">
        <span :class="cls.e('panel-hint')">内容展示在右侧面板</span>
        <UButton size="small" text type="primary" @click="handleOpenPanel">查看面板</UButton>
      </div>
      <!-- 自定义渲染：meta.render / tool-<name> 插槽优先于通用工具视图；
           reply 工具的自定义渲染在回复流，卡片 body 只留默认参数/结果（展开列表用于回溯过程） -->
      <component :is="tool.render" v-else-if="tool?.render && !isReplyTool" :tool-call="toolCall" />
      <component :is="slotBody" v-else-if="slotBody && !isReplyTool && hasResult" />
      <template v-else>
        <pre v-if="showParamsSection" :class="cls.e('data')">{{ toolCall.arguments }}</pre>
        <pre
          v-if="resultRaw"
          :class="[cls.e('data'), bem.is('error', toolCall.status === 'error')]"
          >{{ resultRaw }}</pre>
        <pre v-if="viewRaw" :class="cls.e('data')">{{ viewRaw }}</pre>
      </template>
    </slot>
  </UCollapseItem>
</template>

<script lang="ts" setup>
import './style'
import { UButton, UCollapseItem, UIcon } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, getCurrentInstance, inject, ref, watch } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import type { AiToolCallEmits, AiToolCallProps } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import { isSettledStatus, toolNeedsInteraction, useToolCallBrief } from '../_shared/tool-call-brief'
import { isSummarizedInHeader } from '../_shared/tool-format'

defineOptions({ name: 'UAiToolCall' })

const props = withDefaults(defineProps<AiToolCallProps>(), { defaultExpanded: undefined })

const emit = defineEmits<AiToolCallEmits>()

const slots = defineSlots<{
  /** 头部附加内容插槽 */
  'header-extra'(scope: { toolCall: ChatToolCall }): any
  /** 自定义工具体插槽（传入后替换整个默认 body） */
  default(scope: { toolCall: ChatToolCall }): any
}>()

const cls = bem('ai-tool-call')
const di = inject(AiChatDIKey, undefined)
const instance = getCurrentInstance()

/** 头部摘要共用视图模型（图标/标题/摘要/状态色），与步骤行共享 */
const { tool, isActive, statusClass, headerIcon, toolTitle, parsedArguments, summary } =
  useToolCallBrief(() => props.toolCall, {
    tool: () => props.tool,
    toolIcons: () => props.toolIcons
  })

const isExpanded = ref(props.defaultExpanded ?? false)
/** 用户手动切换过后（或显式传入 defaultExpanded 时），不再随 status 自动展开/折叠 */
let userToggled = props.defaultExpanded !== undefined

/** UCollapseItem 的 change 仅在用户点击头部时触发（程序化 v-model 变更不触发） */
const markUserToggled = () => {
  userToggled = true
}

/** 面板工具：render 展示在右侧侧边面板，卡片 body 仅保留「查看面板」入口 */
const isPanelTool = computed(() => tool.value?.renderTo === 'panel')

/** reply 工具：render 展示在回复流（消息块），卡片 body 不再重复渲染自定义内容 */
const isReplyTool = computed(() => tool.value?.renderTo === 'reply')

/** 「UI 即答复」的终结工具（session 元信息无 terminal，恒为 false） */
const isAnswerTool = computed(() => {
  const t = tool.value
  return !!(t && 'terminal' in t && t.terminal)
})

/** 完成后是否自动折叠：缺省一律折叠；「UI 即答复」的终结工具缺省保持展开 */
const autoCollapse = computed(() => tool.value?.autoCollapse ?? !isAnswerTool.value)

/** 单标量参数已被头部摘要逐字覆盖（或本身为空），body 不再重复展示参数块 */
const showParamsSection = computed(() => !isSummarizedInHeader(parsedArguments.value))

const hasResult = computed(() => {
  return props.toolCall.result != null || props.toolCall.error != null
})

const resultRaw = computed(
  () => (props.toolCall.error ?? props.toolCall.result)?.trim() || undefined
)

/** 服务端下发的 view，直接以原始文本/紧凑 JSON 展示；不得丢弃、不得 throw */
const viewRaw = computed(() => {
  const view = props.toolCall.view
  if (view == null) return undefined
  if (typeof view === 'string') return view.trim() || undefined
  try {
    return JSON.stringify(view)
  } catch {
    return String(view)
  }
})

/** 使用方通过 tool-<name> 插槽自定义该工具的展示（有结果时替换整个 body） */
const slotBody = computed(() => {
  const slot = di?.slots?.[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})

/** 是否存在自定义插槽（组件默认插槽或宿主注入的 tool-<name> 动态插槽） */
const hasCustomSlot = computed(() =>
  Boolean(slots.default || di?.slots?.[`tool-${props.toolCall.name}`])
)

/** 需要用户交互/展示的进行中状态：待确认（有 body 可看时）、有内联自定义 body（提问表单等） */
const needsInteraction = computed(() =>
  toolNeedsInteraction(props.toolCall, { tool: tool.value, hasCustomSlot: hasCustomSlot.value, di })
)

/** 终态（成功/失败/拒绝） */
const isSettled = computed(() => isSettledStatus(props.toolCall.status))

// 默认折叠（含进行中）；仅交互/答复类自动展开，用户手动切换过后不再自动变化
watch(
  [() => props.toolCall.status, autoCollapse, needsInteraction],
  ([status, shouldAutoCollapse, interaction]) => {
    if (userToggled) return
    if (isSettledStatus(status)) {
      isExpanded.value = !shouldAutoCollapse
    } else {
      isExpanded.value = interaction
    }
  },
  { immediate: true }
)

/** 折叠后卸载内容 DOM：仅终态且非面板工具时启用——
 * 进行中/待确认要保留内容状态（确认按钮、表单），面板工具的 body 是「查看面板」入口必须可达 */
const destroyOnCollapse = computed(() => isSettled.value && !isPanelTool.value)

/** 打开右侧面板：先派发 open-panel 事件；未显式监听时回落 DI openPanel */
const handleOpenPanel = () => {
  emit('open-panel', props.toolCall.id)
  const hasListener = Boolean(
    instance?.vnode.props?.onOpenPanel ?? instance?.vnode.props?.['onOpen-panel']
  )
  if (!hasListener) {
    di?.openPanel?.(props.toolCall.id)
  }
}
</script>
