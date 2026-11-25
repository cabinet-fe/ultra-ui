export interface AiReasoningProps {
  /** 思考过程文本 */
  content: string
  /** 是否仍在思考中（流式未闭合） */
  thinking?: boolean
  /** 思考耗时（ms） */
  duration?: number
  /** 用于记忆思考计时的缓存 key */
  cacheKey?: string
  /** 是否默认展开 */
  defaultExpanded?: boolean
}
