import type { AskQuestionResult } from './ask-question'

interface AskQuestionDeferred {
  resolve: (result: AskQuestionResult) => void
  reject: (reason?: unknown) => void
}

/** 挂起的提问 Promise，key 为 toolCallId */
const pending = new Map<string, AskQuestionDeferred>()

/** 注册挂起的提问 Promise（由 createAskQuestionTool 的 execute 调用） */
export function deferAskQuestion(toolCallId: string, deferred: AskQuestionDeferred): void {
  pending.set(toolCallId, deferred)
}

/** 取出并移除挂起项（abort 监听用）；不存在则返回 undefined */
export function takeAskQuestionDeferred(toolCallId: string): AskQuestionDeferred | undefined {
  const deferred = pending.get(toolCallId)
  if (!deferred) return undefined
  pending.delete(toolCallId)
  return deferred
}

/** 兑现挂起的提问 Promise（由提问表单在用户提交时调用） */
export function resolveAskQuestion(toolCallId: string, result: AskQuestionResult): void {
  takeAskQuestionDeferred(toolCallId)?.resolve(result)
}
