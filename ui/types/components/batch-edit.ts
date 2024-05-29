import type { IFormModel } from './form'
import type { TableColumn, TableProps } from './table'
import type { DeconstructValue } from '../helper'

/** 批量编辑列 */
export interface BatchEditColumn extends TableColumn {
  // /**
  //  * 是否在列中显示
  //  * @default true
  //  */
  // visible?: boolean
  // /** 校验规则 */
  // rules?: ValidateRule
  // /** 默认值 */
  // defaultValue?: any | (() => any)
}

/** 批量编辑组件属性 */
export interface BatchEditProps<Model extends IFormModel = IFormModel>
  extends Omit<TableProps, 'selectable' | 'checkable'> {
  /** 是否可调节尺寸 */
  resizable?: boolean
  /**
   * 表单模型
   * @description 该模型优先级要大于列配置
   */
  model?: Model
  /** 表格标题 */
  title?: string
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 只读模式 */
  readonly?: boolean
  /** 删除方法 */
  deleteMethod?: (data: Record<string, any>[]) => Promise<any> | any
  /** 保存方法 */
  saveMethod?: (
    data: Record<string, any>,
    type: 'create' | 'update'
  ) => Promise<any> | any
}

/** 批量编辑组件定义的事件 */
export interface BatchEditEmits {
  (e: 'update:data', value: Record<string, any>[]): void
}

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
