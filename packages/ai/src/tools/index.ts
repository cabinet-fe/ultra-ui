import type { ChatTool } from '../chat/types'
import { createAskQuestionTool } from './ask-question'

export type {
  AskQuestionItem,
  AskQuestionAnswer,
  AskQuestionArgs,
  AskQuestionResult
} from './ask-question'

/** 内置工具列表（useChat 始终注入，不对外导出；新增内置工具在此注册） */
export function createBuiltinTools(): ChatTool[] {
  return [createAskQuestionTool()]
}
