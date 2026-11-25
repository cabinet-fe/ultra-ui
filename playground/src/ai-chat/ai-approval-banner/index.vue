<template>
  <div>
    <CustomCard title="独立审批横幅">
      <div class="demo-actions">
        <UButton size="small" plain @click="resetApprovals">恢复示例审批</UButton>
        <span class="demo-hint">剩余待审批：{{ approvals.length }} 条</span>
      </div>

      <UAiApprovalBanner :approvals="approvals" @respond="handleRespond" />
      <div v-if="!approvals.length" class="demo-empty">所有审批项已处理完毕。</div>
    </CustomCard>

    <CustomCard title="filter-unlinked 过滤行为（对比含 callId 审批项）">
      <div class="demo-actions">
        <label class="demo-toggle">
          <span>仅展示未关联 callId 项 (filter-unlinked)</span>
          <USwitch v-model="filterUnlinked" />
        </label>
        <UButton size="small" plain @click="resetMixed">恢复混合列表</UButton>
      </div>

      <UAiApprovalBanner
        :approvals="mixedApprovals"
        :filter-unlinked="filterUnlinked"
        @respond="handleMixedRespond"
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatPendingApproval, UAiApprovalBanner } from '@veltra/ai'
import { UButton, USwitch, message } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const initialApprovals = (): ChatPendingApproval[] => [
  {
    approvalId: 'appr-1',
    rpcId: 'rpc-1',
    toolName: 'syncDatabase',
    reason: '执行生产库只读索引同步操作'
  },
  {
    approvalId: 'appr-2',
    rpcId: 'rpc-2',
    toolName: 'publishPackage',
    reason: '推送 @veltra/ai 预览版本至内部仓库'
  }
]

const initialMixed = (): ChatPendingApproval[] => [
  {
    approvalId: 'mix-1',
    rpcId: 'rpc-mix-1',
    toolName: 'runMigration',
    reason: '未关联 callId 的会话级审批（默认展示）'
  },
  {
    approvalId: 'mix-2',
    rpcId: 'rpc-mix-2',
    callId: 'call-linked-88',
    toolName: 'deleteFile',
    reason: '已关联 callId=call-linked-88（关闭 filter-unlinked 后可见）'
  }
]

const approvals = ref<ChatPendingApproval[]>(initialApprovals())
const mixedApprovals = ref<ChatPendingApproval[]>(initialMixed())
const filterUnlinked = ref(true)

const handleRespond = (rpcId: string, approved: boolean) => {
  approvals.value = approvals.value.filter((item) => item.rpcId !== rpcId)
  message[approved ? 'success' : 'info'](approved ? '已允许审批请求' : '已拒绝审批请求')
}

const resetApprovals = () => {
  approvals.value = initialApprovals()
}

const handleMixedRespond = (rpcId: string, approved: boolean) => {
  mixedApprovals.value = mixedApprovals.value.filter((item) => item.rpcId !== rpcId)
  message[approved ? 'success' : 'info'](approved ? '已允许审批请求' : '已拒绝审批请求')
}

const resetMixed = () => {
  mixedApprovals.value = initialMixed()
}
</script>

<style scoped lang="scss">
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-empty {
  font-size: 13px;
  color: var(--u-text-color-assist);
}
</style>
