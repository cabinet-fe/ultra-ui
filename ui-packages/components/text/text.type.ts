/** 文本组件属性 */
export interface TextProps {
  modelValue?: string
}

/** 文本组件定义的事件 */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法(组件内部使用) */
export interface _TextExposed {}

/** 文本组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TextExposed {}
