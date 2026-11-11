<template>
  <span :class="[cls.e('thinking-icon'), bem.is('active', active)]" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 主星：思考中放大-回落并轻微旋转，静止时是干净的四角星 -->
      <path
        :class="cls.e('thinking-icon-star')"
        d="M12 3.2c.28 0 .53.18.62.45l1.2 3.6a3.4 3.4 0 0 0 2.17 2.17l3.6 1.2a.66.66 0 0 1 0 1.26l-3.6 1.2a3.4 3.4 0 0 0-2.17 2.17l-1.2 3.6a.66.66 0 0 1-1.25 0l-1.2-3.6a3.4 3.4 0 0 0-2.17-2.17l-3.6-1.2a.66.66 0 0 1 0-1.26l3.6-1.2A3.4 3.4 0 0 0 10.2 7.25l1.2-3.6A.66.66 0 0 1 12 3.2Z"
        fill="currentColor"
        fill-opacity="0.9"
      />
      <!-- 副星：错相微闪，让图标看起来「在运转」而不是一个静态符号 -->
      <path
        :class="cls.e('thinking-icon-spark')"
        d="M18.6 15.1c.12 0 .23.08.27.19l.42 1.26c.09.27.3.48.57.57l1.26.42a.29.29 0 0 1 0 .55l-1.26.42a.87.87 0 0 0-.57.57l-.42 1.26a.29.29 0 0 1-.55 0l-.42-1.26a.87.87 0 0 0-.57-.57l-1.26-.42a.29.29 0 0 1 0-.55l1.26-.42c.27-.09.48-.3.57-.57l.42-1.26a.29.29 0 0 1 .28-.19Z"
        fill="currentColor"
      />
    </svg>
  </span>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { inject } from 'vue'

import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatThinkingIcon' })

defineProps<{
  /** 思考中：主星呼吸 + 副星错相闪烁；否则静止 */
  active?: boolean
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')
</script>
