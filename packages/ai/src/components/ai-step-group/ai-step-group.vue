<template>
  <div :class="[cls.b, bem.is('expanded', expanded), bem.is('settled', !live)]">
    <div :class="cls.e('bar')" @click="toggle">
      <!-- 走马灯：新步骤从下方进入、旧步骤向上离开；同一步骤内部更新原地响应不触发切换 -->
      <Transition :name="cls.m('swap')">
        <div v-if="live && currentStep" :key="currentStep.key" :class="cls.e('view')">
          <template v-if="currentStep.kind === 'reasoning'">
            <ThinkingIcon active :class="cls.e('icon')" />
            <span :class="[cls.e('title'), 'u-shine']">思考中…</span>
            <span v-if="latestReasoningLine" :class="cls.e('text')">
              {{ latestReasoningLine }}
            </span>
          </template>
          <template v-else>
            <UIcon :class="[cls.e('icon'), statusClass]">
              <component :is="headerIcon" />
            </UIcon>
            <span :class="[cls.e('title'), isActive && 'u-shine']">{{ toolTitle }}</span>
            <span v-if="summary" :class="cls.e('text')">{{ summary }}</span>
          </template>
        </div>
        <div v-else :key="`settled:${endStatus ?? 'done'}`" :class="cls.e('view')">
          <UIcon :class="[cls.e('icon'), endStatus ? 'is-danger' : 'is-success']">
            <CircleClose v-if="endStatus" />
            <CircleCheck v-else />
          </UIcon>
          <span :class="cls.e('title')">{{ settledTitle }}</span>
        </div>
      </Transition>
      <span v-if="steps.length > 1" :class="cls.e('count')">{{ steps.length }} 步</span>
      <UIcon :class="cls.e('chevron')"><ArrowRight /></UIcon>
    </div>

    <div v-if="expanded" :class="cls.e('content')">
      <slot :steps="steps">
        <template v-for="(step, index) in steps" :key="step.key">
          <slot name="step" :step="step" :index="index">
            <UAiReasoning
              v-if="step.kind === 'reasoning'"
              :content="step.message.reasoning ?? ''"
              :thinking="step.message.status === 'streaming' && !step.message.content"
              :cache-key="step.message.id"
            />
            <UAiToolCall
              v-else-if="step.toolCall"
              :tool-call="step.toolCall"
              :tool="resolvedToolMap?.[step.toolCall.name]"
              :tool-icons="resolvedToolIcons"
              @respond="(approved) => emit('respond', step.toolCall!.id, approved)"
              @open-panel="handleOpenPanel"
            />
          </slot>
        </template>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UIcon } from '@veltra/desktop'
import { ArrowRight, CircleCheck, CircleClose } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, getCurrentInstance, inject, ref, watch } from 'vue'

import type { AiStepGroupEmits, AiStepGroupProps, AiStepItem } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import ThinkingIcon from '../_shared/thinking-icon.vue'
import {
  normalizeToolsMap,
  toolNeedsInteraction,
  useToolCallBrief
} from '../_shared/tool-call-brief'
import { lastNonEmptyLine } from '../_shared/tool-format'
import { useStreamThrottle } from '../_shared/use-stream-throttle'
import { UAiReasoning } from '../ai-reasoning'
import { UAiToolCall } from '../ai-tool-call'

defineOptions({ name: 'UAiStepGroup' })

const props = withDefaults(defineProps<AiStepGroupProps>(), {
  live: false,
  defaultExpanded: undefined
})

const emit = defineEmits<AiStepGroupEmits>()

defineSlots<{
  /** 自定义步骤列表内容（覆盖默认步骤渲染） */
  default(scope: { steps: AiStepItem[] }): any
  /** 自定义单个步骤项渲染 */
  step(scope: { step: AiStepItem; index: number }): any
}>()

const cls = bem('ai-step-group')
const di = inject(AiChatDIKey, undefined)
const instance = getCurrentInstance()

const resolvedToolMap = computed(() => normalizeToolsMap(props.tools) ?? di?.tools?.value)
const resolvedToolIcons = computed(() => props.toolIcons ?? di?.toolIcons?.value)

/** 单步是否已落定：工具步看调用状态；思考步看来源消息是否仍在「流式且未出正文」 */
const isStepSettled = (step: AiStepItem): boolean => {
  if (step.kind === 'tool') {
    const status = step.toolCall?.status
    return status !== 'pending' && status !== 'awaiting-confirm' && status !== 'running'
  }
  return !(step.message.status === 'streaming' && !step.message.content)
}

/** 当前步骤：第一个未落定的步骤（串行执行，之前的都已落定）；全部落定取最后一个 */
const currentStep = computed<AiStepItem | undefined>(() => {
  const list = props.steps
  if (!list.length) return undefined
  return list.find((step) => !isStepSettled(step)) ?? list[list.length - 1]!
})

/** 当前工具步的调用（当前步是思考时为 undefined） */
const currentToolCall = computed(() => {
  const step = currentStep.value
  return step?.kind === 'tool' ? step.toolCall : undefined
})

const { isActive, statusClass, headerIcon, toolTitle, summary } = useToolCallBrief(
  currentToolCall,
  { tools: () => resolvedToolMap.value, toolIcons: () => resolvedToolIcons.value }
)

const settledTitle = computed(() => {
  if (props.endStatus === 'error') return '出错了'
  if (props.endStatus === 'aborted') return '已停止'
  return props.steps.length ? `执行了 ${props.steps.length} 个步骤` : '已完成'
})

const expanded = ref(props.defaultExpanded ?? false)
/** 用户手动切换过后（或显式传入 defaultExpanded 时），不再随交互需求自动展开/收起 */
let userToggled = props.defaultExpanded !== undefined

const toggle = () => {
  userToggled = true
  expanded.value = !expanded.value
}

/** 是否应自动展开列表：与卡片共用 toolNeedsInteraction 单一入口，
 * expandOnConfirm 使待确认一律展开——允许/拒绝按钮在列表内的卡片头上，收起即不可达 */
const needsExpand = computed(() => {
  if (!props.live) return false
  const call = currentToolCall.value
  if (!call) return false
  return toolNeedsInteraction(call, {
    tool: resolvedToolMap.value?.[call.name],
    di,
    expandOnConfirm: true
  })
})

// 默认收起；live 期间需要交互时自动展开，段落落定后收回（用户手动切换过则不再自动）
watch(
  needsExpand,
  (needed) => {
    if (userToggled) return
    expanded.value = needed
  },
  { immediate: true }
)

const rawReasoning = computed(() => {
  const step = currentStep.value
  if (!step || step.kind !== 'reasoning' || expanded.value) return ''
  const msg = step.message
  if (msg.status !== 'streaming' || msg.content) return ''
  return msg.reasoning ?? ''
})

const throttledReasoning = useStreamThrottle(
  () => rawReasoning.value,
  () => !!rawReasoning.value
)

/** 行内右侧滚动展示的最新一行思考：取最后一行非空文本，随流式输出节流刷新 */
const latestReasoningLine = computed(() => lastNonEmptyLine(throttledReasoning.value))

/** 打开右侧面板：先派发 open-panel 事件；未显式监听时回落 DI openPanel */
const handleOpenPanel = (toolCallId: string) => {
  emit('open-panel', toolCallId)
  const hasListener = Boolean(
    instance?.vnode.props?.onOpenPanel ?? instance?.vnode.props?.['onOpen-panel']
  )
  if (!hasListener) {
    di?.openPanel?.(toolCallId)
  }
}
</script>
