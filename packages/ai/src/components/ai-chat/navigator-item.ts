/** 会话导航项：一轮用户提问（含其后的答复） */
export interface NavigatorItem {
  /** 轮次 key（同 turns，用于跳转定位） */
  key: string
  /** 轮次序号（0 起，展示时 +1） */
  index: number
  /** 目录标题（用户提问的单行摘要） */
  title: string
  /** 相对权重（0~1）：该轮内容量占全文的比例，用于刻度长度 */
  weight: number
}
