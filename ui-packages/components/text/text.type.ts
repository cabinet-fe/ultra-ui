/** 文本组件属性 */
export interface TextProps {
  /** 文本最大行数, 超出的部分会被隐藏 */
  maxRows?: number
  /** 文本角色, 默认content正文 */
  role?: 'title' | 'sub-title' | 'content'
  /** 文本大小, 与role同时指定时会覆盖role */
  fontSize?: string | number
}

/** 文本组件定义的事件 */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法(组件内部使用) */
export interface _TextExposed {}

/** 文本组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TextExposed {}
