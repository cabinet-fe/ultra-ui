export type ComponentSize = 'small' | 'default' | 'large'

/** 组件通用属性 */
export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** 表单组件通用属性 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?: string | number | 'max'
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
}

/** 带有服务端交互功能的组件属性 */
export interface PropsWithServerQuery {
  /** 请求接口地址 */
  api?: string
  /** 请求查询参数 */
  query?: Record<string, any>
}
