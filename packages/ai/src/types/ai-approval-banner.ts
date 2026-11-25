import type { ChatPendingApproval } from '../chat/fold'

export interface AiApprovalBannerProps {
  /** 待审批请求列表 */
  approvals: ChatPendingApproval[]
  /** 是否仅展示未绑定 callId 的审批项，默认 true */
  filterUnlinked?: boolean
}

export interface AiApprovalBannerEmits {
  /** 响应审批请求 */
  (e: 'respond', rpcId: string, approved: boolean): void
}
