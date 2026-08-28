<template>
  <div v-if="items.length" :class="cls.e('approval-banner')">
    <div v-for="item in items" :key="item.approvalId" :class="cls.e('approval-banner-card')">
      <div :class="cls.e('approval-banner-title')">需要确认</div>
      <div v-if="item.reason || item.toolName" :class="cls.e('approval-banner-reason')">
        {{ item.reason ?? item.toolName }}
      </div>
      <div :class="cls.e('approval-banner-actions')">
        <UButton size="small" type="primary" @click="emit('respond', item.rpcId, true)">
          允许
        </UButton>
        <UButton size="small" text @click="emit('respond', item.rpcId, false)">拒绝</UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { ChatPendingApproval } from '../../chat/fold'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatApprovalBanner' })

const props = defineProps<{ approvals: ChatPendingApproval[] }>()

const emit = defineEmits<{ (e: 'respond', rpcId: string, ok: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 仅无 callId 的审批走横幅；有 callId 的走工具卡确认 */
const items = computed(() => props.approvals.filter((item) => !item.callId))
</script>
