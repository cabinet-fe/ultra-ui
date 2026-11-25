import type { AskQuestionAnswer, AskQuestionItem } from '../tools'

export interface AiQuestionCardProps {
  /** 待回答的问题列表 */
  questions: AskQuestionItem[]
  /** 已提交的回答摘要；有值时展示只读摘要而非交互表单 */
  answers?: AskQuestionAnswer[]
  /** 错误提示文案 */
  error?: string
}

export interface AiQuestionCardEmits {
  /** 提交问答结果 */
  (e: 'submit', answers: AskQuestionAnswer[]): void
}
