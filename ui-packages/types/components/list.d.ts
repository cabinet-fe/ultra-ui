import type { PropsWithServerQuery } from '../component-common'

/** 列表组件属性 */
export interface ListProps {
  /** 列表数据源 */
  dataSource: any[]
}

/** 列表数据源属性 */
export interface DataSourceOptions {
  /** 选中 */
  checked?: string
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
