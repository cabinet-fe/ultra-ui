/** 会话导航项：一轮用户提问（含其后的答复摘要） */
export interface NavigatorItem {
  /** 轮次 key（同 turns，用于跳转定位） */
  key: string
  /** 轮次序号（0 起，展示时 +1） */
  index: number
  question: string
  /** 本轮回答前缀（尚无文字回答时缺省） */
  answer?: string
}
