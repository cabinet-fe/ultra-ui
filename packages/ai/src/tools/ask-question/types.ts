/** 预设选项项（支持纯字符串或带说明的结构化选项） */
export interface AskQuestionOption {
  /** 选项展示文案（支持标注 `(推荐)` / `(Recommended)` 自动提取为推荐徽标） */
  label: string
  description?: string
}

export interface AskQuestionItem {
  question: string
  /** 简短分类标签（如「鉴权方式」「技术栈」） */
  header?: string
  /** 预设选项（支持字符串或 { label, description }）；缺省为纯文本题 */
  options?: (string | AskQuestionOption)[]
  /** 是否允许多选（默认 false 单选） */
  multiple?: boolean
  placeholder?: string
}

export interface AskQuestionAnswer {
  question: string
  /** 用户回答（单选为所选值或自定义输入；多选为顿号连接的字符串） */
  answer: string
  /** 多选回答列表（多选或含多项时提供） */
  answers?: string[]
  skipped?: boolean
}

/** 提问工具参数（模型输出） */
export interface AskQuestionArgs {
  questions: AskQuestionItem[]
}

/** 提问工具结果（序列化后回灌模型，渲染层据此展示问答摘要） */
export interface AskQuestionResult {
  answers: AskQuestionAnswer[]
}
