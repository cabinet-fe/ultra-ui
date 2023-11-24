import type { PropsWithServerQuery } from '../component-common'

/** 列表数据源属性 */
export interface DataSourceOptions {
  /** 选中 */
  checked?: boolean

  /** 头像 */
  avatar?: string

  /** 标题 */
  title?: string

  /** 描述 */
  desc?: string

  /** 日期 */
  date?: string

  /** 标签内容 */
  tag?: string
  tagType?: '' | 'success' | 'info' | 'warning' | 'danger' | 'primary'
}

/** 按钮属性 */
export interface ActionOptions {
  /** 文字 */
  text?: string

  /** 图标 */
  icon?: string
}

export interface ListProps {
  /** 显示单选框/复选框 */
  showCheck?: boolean

  /** 列表数据 */
  data: DataSourceOptions[]

  /** 显示操作按钮 */
  showActions?: boolean

  /** 操作组 */
  action?: ActionOptions[]
}

export interface ListEmits {
  /** 删除 */
  (e: 'delete', value: any, index: number): void

  /** 信息 */
  (e: 'message', value: any, index: number): void

  /** 提示 */
  (e: 'tip', value: any, index: number): void

  /** checkbox事件 */
  (e: 'update:check', value: any): void
}

export interface ListExposed {}
