import type { IFormModel } from './form'
import type { TableProps } from './table'
import type { DeconstructValue } from '../helper'

/** 批量编辑组件属性 */
export interface BatchEditProps<Model extends IFormModel = IFormModel>
  extends Omit<TableProps, 'selectable' | 'checkable'> {
  /** 表单模型 */
  model?: Model
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 禁用编辑 */
  disabled?: boolean
}

/** 批量编辑组件定义的事件 */
export interface BatchEditEmits {
  (e: 'update:data', value: Record<string, any>): void
}

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
