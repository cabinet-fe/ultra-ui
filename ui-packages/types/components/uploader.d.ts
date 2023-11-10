import type { DeconstructValue } from '../helper'

/** 文件上传器组件属性 */
export interface UploaderProps {
  modelValue?: string

  /** 允许上传的文件类型 */
  accept?: string
}

/** 文件上传器组件定义的事件 */
export interface UploaderEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文件上传器组件暴露的属性和方法(组件内部使用) */
export interface _UploaderExposed {}

/** 文件上传器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type UploaderExposed = DeconstructValue<_UploaderExposed>
