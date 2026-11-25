import type { Component } from 'vue'

import type { ChatJob } from '../chat/types'

export interface AiJobBarProps {
  /** 作业项列表 */
  jobs: ChatJob[]
  /** 按作业 kind / 工具名覆写图标 */
  toolIcons?: Record<string, Component>
  /** 是否默认展开 */
  defaultExpanded?: boolean
}
