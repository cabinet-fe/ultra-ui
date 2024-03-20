import type { PropsWithServerQuery } from '../component-common'

/** 列表数据源属性 */
export interface DataSourceOptions {
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

export interface ListProps {
  /** 列表数据 */
  data: DataSourceOptions[]

  /** 当前页码 */
  currentPage?: number

  /** 每页显示多少条 */
  pageSize?: number

  /** 每页显示多少条 */
  pageSize?: number

  /** 总数量 */
  total?: number

  /** 是否拖拽 */
  draggable?: boolean

  /** 是否无限滚动 */
  infiniteScroll?: boolean

  /** 容器标签元素 */
  tag?: string
}

export interface ListEmits {
  (e: 'load-more', context: { current: number }): void

}

export interface ListExposed {}
