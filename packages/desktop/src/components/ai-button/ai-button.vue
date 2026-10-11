<template>
  <!-- pre-input 变体：先经气泡收集补充输入，确认后再发请求 -->
  <u-tip
    v-if="variant === 'pre-input'"
    trigger="click"
    direction="bottom"
    v-model:visible="visible"
  >
    <u-button :class="cls.b" :size="size" :icon="Sparkles" :loading="loading" />

    <template #content>
      <div :class="cls.e('main')">
        <slot name="pre-input" />
      </div>
      <div :class="cls.e('action')">
        <u-button size="small" type="primary" text @click="cancel"> 取消 </u-button>
        <u-button size="small" type="primary" @click="confirm"> 确认 </u-button>
      </div>
    </template>
  </u-tip>

  <!-- 普通变体：点击即发 -->
  <u-button v-else :class="cls.b" :size="size" :icon="Sparkles" :loading="loading" @click="send" />
</template>

<script lang="ts" setup>
import { useConfig } from '@veltra/compositions'
import { Sparkles } from '@veltra/icons'
import { bem, requestAiText } from '@veltra/utils'
import type { AiProviderConfig } from '@veltra/utils'
import { computed, ref } from 'vue'

import type { AiButtonEmits, AiButtonProps } from '../../types'
import { UButton } from '../button'
import { UTip } from '../tip'

defineOptions({ name: 'UAiButton' })

const { provider, systemPrompt, prompt, variant = 'default', size } = defineProps<AiButtonProps>()

const emit = defineEmits<AiButtonEmits>()

const cls = bem('ai-button')

const { config } = useConfig()

/** 配置优先级：实例 provider 字段 > 全局 ai 字段 > 默认值（stream 缺省 false） */
const requestConfig = computed<AiProviderConfig>(() => ({
  stream: false,
  ...config.ai,
  ...provider
}))

/** 生成中：按钮 loading 转圈并禁用 */
const loading = ref(false)

/** 发起请求；生成中忽略重复触发 */
function send() {
  if (loading.value) return
  loading.value = true

  requestAiText({
    config: requestConfig.value,
    prompt: prompt ?? '',
    systemPrompt,
    onDelta: (chunk) => emit('delta', chunk),
    onSuccess: (text) => emit('success', text),
    onError: (error) => emit('error', error)
  }).finally(() => {
    loading.value = false
  })
}

/** pre-input 气泡可见性 */
const visible = ref(false)

function confirm() {
  emit('confirm')
  visible.value = false
  send()
}

function cancel() {
  emit('cancel')
  visible.value = false
}
</script>
