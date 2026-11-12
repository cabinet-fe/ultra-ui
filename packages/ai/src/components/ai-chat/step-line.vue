<template>
  <div :class="[cls.e('step-line'), bem.is('expanded', expanded), bem.is('settled', !live)]">
    <!-- 步骤行：固定高度，实时展示当前步骤；点击展开下方全部已执行步骤 -->
    <div :class="cls.e('step-line-bar')" @click="toggle">
      <!-- 走马灯：新步骤从下方进入、旧步骤向上离开；同一步骤内部更新原地响应不触发切换 -->
      <Transition :name="cls.em('step-line', 'swap')">
        <!-- live：当前步骤的实时视图 -->
        <div v-if="live && currentStep" :key="currentStep.key" :class="cls.e('step-line-view')">
          <template v-if="currentStep.kind === 'reasoning'">
            <ThinkingIcon active :class="cls.e('step-line-icon')" />
            <span :class="[cls.e('step-line-title'), 'u-shine']">思考中…</span>
            <span v-if="latestReasoningLine" :class="cls.e('step-line-text')">
              {{ latestReasoningLine }}
            </span>
          </template>
          <template v-else>
            <UIcon :class="[cls.e('step-line-icon'), statusClass]">
              <component :is="headerIcon" />
            </UIcon>
            <span :class="[cls.e('step-line-title'), isActive && 'u-shine']">{{ toolTitle }}</span>
            <span v-if="summary" :class="cls.e('step-line-text')">{{ summary }}</span>
          </template>
        </div>
        <!-- 落定：完成态摘要 -->
        <div v-else :key="`settled:${endStatus ?? 'done'}`" :class="cls.e('step-line-view')">
          <UIcon :class="[cls.e('step-line-icon'), endStatus ? 'is-danger' : 'is-success']">
            <CircleClose v-if="endStatus" />
            <CircleCheck v-else />
          </UIcon>
          <span :class="cls.e('step-line-title')">{{ settledTitle }}</span>
        </div>
      </Transition>
      <span v-if="steps.length > 1" :class="cls.e('step-line-count')">{{ steps.length }} 步</span>
      <UIcon :class="cls.e('step-line-chevron')"><ArrowRight /></UIcon>
    </div>

    <!-- 展开列表：全部已执行步骤（思考块 + 工具卡片），折叠时完全卸载 -->
    <div v-if="expanded" :class="cls.e('step-line-content')">
      <template v-for="step in steps" :key="step.key">
        <ReasoningBlock v-if="step.kind === 'reasoning'" :message="step.message" />
        <ToolCallCard
          v-else-if="step.toolCall"
          :tool-call="step.toolCall"
          @respond="(approved) => emit('respond', step.toolCall!.id, approved)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@veltra/desktop'
import { ArrowRight, CircleCheck, CircleClose } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch } from 'vue'

import { AiChatDIKey } from './di'
import ReasoningBlock from './reasoning-block.vue'
import ThinkingIcon from './thinking-icon.vue'
import { toolNeedsInteraction, useToolCallBrief } from './tool-call-brief'
import ToolCallCard from './tool-call.vue'
import { lastNonEmptyLine } from './tool-format'
import type { TurnStep } from './turn-step'

defineOptions({ name: 'UAiChatStepLine' })

const props = defineProps<{
  /** 本段全部步骤（按流式顺序） */
  steps: TurnStep[]
  /** 是否流式进行中（行内实时展示当前步骤；落定后定格为完成态摘要） */
  live?: boolean
  /** 段末终态：error / aborted 时完成态摘要着危险色 */
  endStatus?: 'error' | 'aborted'
}>()

const emit = defineEmits<{ (e: 'respond', toolCallId: string, approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 单步是否已落定：工具步看调用状态；思考步看来源消息是否仍在「流式且未出正文」 */
const isStepSettled = (step: TurnStep): boolean => {
  if (step.kind === 'tool') {
    const status = step.toolCall?.status
    return status !== 'pending' && status !== 'awaiting-confirm' && status !== 'running'
  }
  return !(step.message.status === 'streaming' && !step.message.content)
}

/** 当前步骤：第一个未落定的步骤（串行执行，之前的都已落定）；全部落定取最后一个 */
const currentStep = computed<TurnStep | undefined>(() => {
  const list = props.steps
  if (!list.length) return undefined
  return list.find((step) => !isStepSettled(step)) ?? list[list.length - 1]!
})

/** 当前工具步的调用（当前步是思考时为 undefined） */
const currentToolCall = computed(() => {
  const step = currentStep.value
  return step?.kind === 'tool' ? step.toolCall : undefined
})

const { isActive, statusClass, headerIcon, toolTitle, summary } = useToolCallBrief(currentToolCall)

/** 行内右侧滚动展示的最新一行思考：取最后一行非空文本，随流式输出持续刷新 */
const latestReasoningLine = computed(() => {
  const step = currentStep.value
  if (!step || step.kind !== 'reasoning' || expanded.value) return ''
  const msg = step.message
  if (msg.status !== 'streaming' || msg.content) return ''
  return lastNonEmptyLine(msg.reasoning ?? '')
})

/** 落定后的完成态摘要 */
const settledTitle = computed(() => {
  if (props.endStatus === 'error') return '出错了'
  if (props.endStatus === 'aborted') return '已停止'
  return `执行了 ${props.steps.length} 个步骤`
})

const expanded = ref(false)
/** 用户手动切换过后，不再随交互需求自动展开/收起 */
let userToggled = false

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
  return toolNeedsInteraction(call, di, { expandOnConfirm: true })
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
</script>
