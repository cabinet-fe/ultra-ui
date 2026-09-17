<template>
  <div :class="cls.e('input-area')">
    <div v-if="attachments.length" :class="cls.e('input-attachments')">
      <div
        v-for="(att, index) in attachments"
        :key="att.dataUrl"
        :class="cls.e('input-attachment')"
      >
        <img :src="att.dataUrl" :alt="att.name" />
        <UIcon :class="cls.e('input-attachment-remove')" @click="attachments.splice(index, 1)">
          <Close />
        </UIcon>
      </div>
    </div>

    <textarea
      ref="textareaRef"
      v-model="text"
      :class="cls.e('input')"
      :placeholder="placeholderText"
      rows="1"
      @keydown.enter.exact.prevent="handleSend"
      @input="autoResize"
    />

    <div :class="cls.e('input-toolbar')">
      <div :class="cls.e('input-toolbar-left')">
        <UFilePicker multiple :accept="accept ?? 'image/*'" @pick="handlePick">
          <UIcon :class="cls.e('input-attach')" title="添加图片">
            <Attach />
          </UIcon>
        </UFilePicker>

        <span :class="[cls.e('input-clear-wrap'), bem.is('disabled', !clearable)]">
          <UPopConfirm
            title="清空当前对话？进行中的生成将被中止。"
            confirm-text="清空"
            direction="top"
            alignment="start"
            @confirm="emit('clear')"
          >
            <template #reference>
              <UIcon :class="cls.e('input-clear')" title="清除会话">
                <Clear />
              </UIcon>
            </template>
          </UPopConfirm>
        </span>
      </div>

      <!-- 右簇：token 用量环 → 模型/推理选择 → 发送或停止（互斥） -->
      <div :class="cls.e('input-toolbar-right')">
        <UDropdown
          v-if="tokenUsage"
          width="auto"
          min-width="200px"
          :content-class="cls.e('usage-panel')"
        >
          <template #trigger>
            <button type="button" :class="cls.e('usage-trigger')" aria-label="Token 用量">
              <svg :class="cls.e('usage-ring')" viewBox="0 0 36 36">
                <circle :class="cls.e('usage-ring-track')" cx="18" cy="18" r="15.5" />
                <circle
                  :class="cls.e('usage-ring-value')"
                  cx="18"
                  cy="18"
                  r="15.5"
                  pathLength="100"
                  transform="rotate(-90 18 18)"
                  :stroke-dasharray="`${contextPercent ?? 0} 100`"
                  :stroke-linecap="contextPercent ? 'round' : undefined"
                />
              </svg>
            </button>
          </template>

          <template #content>
            <div :class="cls.e('usage-list')">
              <div v-if="contextText" :class="cls.e('usage-row')">
                <span :class="cls.e('usage-label')">上下文占用</span>
                <span :class="cls.e('usage-value')">{{ contextText }}</span>
              </div>
              <div v-for="row in usageRows" :key="row.label" :class="cls.e('usage-row')">
                <span :class="cls.e('usage-label')">{{ row.label }}</span>
                <span :class="cls.e('usage-value')">{{ row.value }}</span>
              </div>
            </div>
          </template>
        </UDropdown>

        <ModelPicker
          v-if="models?.length"
          v-model:model="model"
          v-model:reasoning-level="reasoningLevel"
          :models="models"
        />

        <UButton
          v-if="showStop"
          key="stop"
          size="small"
          type="danger"
          circle
          title="停止生成"
          @click="emit('abort')"
        >
          <span :class="cls.e('input-stop')" />
        </UButton>
        <UButton
          v-else
          key="send"
          size="small"
          type="primary"
          circle
          :disabled="!hasContent"
          :icon="Up"
          :title="running ? '加入待发送队列' : undefined"
          @click="handleSend"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDropdown, UFilePicker, UIcon, UPopConfirm } from '@veltra/desktop'
import { Attach, Clear, Close, Up } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue'

import type { ChatAttachment, ChatTokenUsage } from '../../chat/types'
import type { ChatModelOption } from '../../providers'
import { AiChatDIKey } from './di'
import ModelPicker from './model-picker.vue'

defineOptions({ name: 'UAiChatInput' })

const props = defineProps<{
  /** 是否生成中（空输入显示停止，有内容则发送入队） */
  running: boolean
  /** 可选模型列表；有值则显示选择器 */
  models?: ChatModelOption[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型 */
  accept?: string
  /** 单个附件最大字节数 */
  maxAttachmentSize?: number
  /** 是否可清除（有消息 / 队列 / 生成中） */
  clearable?: boolean
  /** 会话累计 token；无 usage 时为 null，不展示 */
  tokenUsage?: ChatTokenUsage | null
  /** 最近一次单次请求的 token（未累计）；配合模型 contextWindow 计算用量环占比 */
  lastRequestUsage?: ChatTokenUsage | null
  /** 是否展示缓存命中 / 未命中（默认只显示总 token） */
  tokenUsageDetail?: boolean
}>()

const model = defineModel<string>('model')
const reasoningLevel = defineModel<string>('reasoningLevel')

const emit = defineEmits<{
  (e: 'send', content: string, attachments: ChatAttachment[]): void
  (e: 'abort'): void
  (e: 'clear'): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const text = ref('')
const attachments = ref<ChatAttachment[]>([])
const textareaRef = shallowRef<HTMLTextAreaElement>()

const hasContent = computed(() => !!text.value.trim() || attachments.value.length > 0)

/** 生成中且输入为空时显示停止；有内容则显示发送（入队） */
const showStop = computed(() => props.running && !hasContent.value)

/**
 * 用量数字：不到 1000 原样；≥1000 用 K；≥100 万用 M。
 * 最多 1 位小数，整数不写 `.0`（1000 → 1K，1500 → 1.5K）。
 */
const formatTokenCount = (n: number) => {
  const scaled = (value: number, unit: 'K' | 'M') => {
    const rounded = Math.round(value * 10) / 10
    return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}${unit}`
  }
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    const k = Math.round((n / 1000) * 10) / 10
    // 四舍五入后会变成 1000K 时改用 M
    return k >= 1000 ? scaled(n / 1_000_000, 'M') : scaled(n / 1000, 'K')
  }
  return scaled(n / 1_000_000, 'M')
}

/** 百分比：最多 1 位小数，整数不写 `.0` */
const formatPercent = (p: number) => {
  const rounded = Math.round(p * 10) / 10
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}%`
}

/** 当前模型声明的上下文窗口；未声明则用量环不填充、面板不显示占用 */
const contextWindow = computed(() => {
  return props.models?.find((m) => m.id === model.value)?.contextWindow
})

/** 上下文占用百分比：最近一次请求总 token / 窗口上限；缺数据时为 null */
const contextPercent = computed(() => {
  const win = contextWindow.value
  const total = props.lastRequestUsage?.totalTokens
  if (!win || total == null) return null
  return Math.min(100, (total / win) * 100)
})

/** 面板占用行文案：1.5K / 128K · 1.2% */
const contextText = computed(() => {
  const percent = contextPercent.value
  const win = contextWindow.value
  const total = props.lastRequestUsage?.totalTokens
  if (percent == null || !win || total == null) return ''
  return `${formatTokenCount(total)} / ${formatTokenCount(win)} · ${formatPercent(percent)}`
})

/** 明细面板行：总 / 输入 / 输出；明细开关下再拼有数据的缓存项，缺字段不写 0 */
const usageRows = computed(() => {
  const usage = props.tokenUsage
  if (!usage) return []
  const rows = [
    { label: '总 token', value: formatTokenCount(usage.totalTokens) },
    { label: '输入', value: formatTokenCount(usage.promptTokens) },
    { label: '输出', value: formatTokenCount(usage.completionTokens) }
  ]
  if (props.tokenUsageDetail) {
    if (usage.cacheHitTokens != null) {
      rows.push({ label: '缓存命中', value: formatTokenCount(usage.cacheHitTokens) })
    }
    if (usage.cacheMissTokens != null) {
      rows.push({ label: '缓存未命中', value: formatTokenCount(usage.cacheMissTokens) })
    }
  }
  return rows
})

/** 生成中提示用户消息将进入队列 */
const placeholderText = computed(() => {
  if (props.running) return '会话进行中，发送的消息将进入待发送队列'
  return props.placeholder ?? '输入消息，Enter 发送，Shift + Enter 换行'
})

const MAX_INPUT_HEIGHT = 160

/** 多行自适应高度，上限 160px */
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  const nextHeight = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)
  el.style.height = `${nextHeight}px`
  el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? 'auto' : 'hidden'
}

watch(placeholderText, () => {
  void nextTick(autoResize)
})

const handleSend = () => {
  if (!hasContent.value) return
  emit('send', text.value.trim(), attachments.value)
  text.value = ''
  attachments.value = []
  autoResize()
}

/** 取回内容到输入框（队列编辑场景），并聚焦 */
const setContent = (content: string) => {
  text.value = content
  void nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

/** 读取当前输入框内容 */
const getContent = () => text.value

defineExpose({ setContent, getContent })

/** 将拾取的文件转为 dataUrl 附件（超限忽略） */
const handlePick = (files: File[]) => {
  const maxSize = props.maxAttachmentSize ?? 10 * 1024 * 1024

  for (const file of files) {
    if (file.size > maxSize) {
      console.warn(`[UAiChat] 附件 ${file.name} 超过大小限制，已忽略`)
      continue
    }
    const reader = new FileReader()
    reader.onload = () => {
      attachments.value.push({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: String(reader.result)
      })
    }
    reader.readAsDataURL(file)
  }
}
</script>
