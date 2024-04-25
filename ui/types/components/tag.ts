/** 标签类型 */
type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

/** 标签尺寸 */
type sizeType = 'large' | 'default' | 'small'

/** 标签组件属性 */
export interface TagProps {
  type?: TagType
  /** 是否可移除 */
  closable?: boolean
  /** 尺寸大小 */
  size?: sizeType
  /** 是否为圆角 */
  round?: boolean
  /** 深色 */
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}
export interface TagExposed {}
