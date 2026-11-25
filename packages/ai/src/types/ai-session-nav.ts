/** 会话导航项：一轮用户提问（含其后的答复摘要） */
export interface AiSessionNavItem {
  /** 轮次唯一标识（用于跳转定位） */
  key: string
  /** 轮次序号（0 起） */
  index: number
  /** 用户提问文本 */
  question: string
  /** 本轮回答前缀摘要 */
  answer?: string
}

export interface AiSessionNavProps {
  /** 导航轮次列表 */
  items: AiSessionNavItem[]
  /** 当前视口高亮的轮次 key */
  activeKey?: string
  /** 列表是否可滚动（不溢出时可隐藏导航） */
  scrollable?: boolean
  /** 显示导航的最小轮次数 */
  minItems?: number
}

export interface AiSessionNavEmits {
  /** 点击圆点跳转到指定轮次 */
  (e: 'jump', key: string): void
}
