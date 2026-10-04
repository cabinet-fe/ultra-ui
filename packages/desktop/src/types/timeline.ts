/** 时间线节点圆点颜色语义 */
export type TimelineItemColor = 'default' | 'primary' | 'success' | 'warning' | 'danger'

/** 时间线容器组件属性 */
export interface TimelineProps {}

/** 时间线节点属性 */
export interface TimelineItemProps {
  /** 节点圆点颜色语义，默认 'default'（中性色圆点） */
  color?: TimelineItemColor
  /** 节点时间戳文本 */
  timestamp?: string
  /** 时间戳位置：top 内容上方 / bottom 内容下方，默认 'bottom' */
  timestampPlacement?: 'top' | 'bottom'
}
