/** 文本组件属性 */
export interface TextProps {
  /** 文本最大行数, 超出的部分会被隐藏 */
  maxRows?: number
  /** 使用预设文本类型, 默认content正文 */
  as?: 'main-title' | 'title' | 'sub-title' | 'content' | 'additional'
  /** 文本大小, 与as同时指定时会覆盖as */
  fontSize?: string | number
  /** 是否删除 */
  deleted?: boolean
  /** 下划线 */
  underline?: boolean
  /** 粗体, 与as同时指定时会覆盖as中的字体粗细 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 高亮 */
  highlight?: string | string[]
}

/** 文本组件定义的事件 */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法(组件内部使用) */
export interface _TextExposed {}

/** 文本组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TextExposed {}
