<template>
  <div v-if="items.length" :class="cls.b">
    <div v-for="item in items" :key="item.approvalId" :class="cls.e('card')">
      <div :class="cls.e('title')">需要确认</div>
      <div v-if="item.reason || item.toolName" :class="cls.e('reason')">
        {{ item.reason ?? item.toolName }}
      </div>
      <div :class="cls.e('actions')">
        <UButton size="small" type="primary" @click="emit('respond', item.rpcId, true)">
          允许
        </UButton>
        <UButton size="small" text @click="emit('respond', item.rpcId, false)">拒绝</UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UButton } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { AiApprovalBannerEmits, AiApprovalBannerProps } from '../../types'

defineOptions({ name: 'UAiApprovalBanner' })

const props = withDefaults(defineProps<AiApprovalBannerProps>(), { filterUnlinked: true })

const emit = defineEmits<AiApprovalBannerEmits>()

const cls = bem('ai-approval-banner')

/** 默认仅展示无 callId 的审批（有 callId 的走工具卡确认） */
const items = computed(() =>
  props.filterUnlinked ? props.approvals.filter((item) => !item.callId) : props.approvals
)
</script>
