export type TimelineItemColor = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface TimelineProps {}

export interface TimelineItemProps {
  /** 节点圆点颜色语义，默认 'default'（中性色圆点） */
  color?: TimelineItemColor
  timestamp?: string
  /** 时间戳位置：top 内容上方 / bottom 内容下方，默认 'bottom' */
  timestampPlacement?: 'top' | 'bottom'
}
