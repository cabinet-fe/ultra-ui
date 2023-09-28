/** 行表单组件属性 */
export interface RowFormProps {
  modelValue?: string
}

/** 行表单组件定义的事件 */
export interface RowFormEmits {
  (e: 'update:modelValue', value: string): void
}

/** 行表单组件暴露的属性和方法(组件内部使用) */
export interface _RowFormExposed {}

/** 行表单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface RowFormExposed {}
