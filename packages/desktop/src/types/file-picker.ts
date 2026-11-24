import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface UploaderProps extends FormComponentProps {
  tag?: string
  accept?: string
  multiple?: boolean
}

export interface UploaderEmits {
  (e: 'pick', files: File[]): void
}

export interface _UploaderExposed {}

/** 文件上传器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type UploaderExposed = DeconstructValue<_UploaderExposed>
