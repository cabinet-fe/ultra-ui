import type { DeconstructValue } from '@veltra/utils'

import type { ActionProps } from './action'
import type { IFormModel } from './form'
import type { TableColumn, TableEmits, TableProps, TableRow } from './table'

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

export type BatchEditFeature = 'create' | 'update' | 'copy' | 'delete' | 'view' | 'createChild'

/** 批量编辑组件属性 */
export interface BatchEditProps<Model extends IFormModel = IFormModel> extends TableProps {
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
  /** label的宽度 */
  labelWidth?: string | number
  /** 删除方法 */
  deleteMethod?: (data: Record<string, any>[]) => any
  /**
   * 保存方法
   * @description 这个方法旨在快编时生效
   * @returns 如果返回一个值，那么这个值会被插入，否则插入的为表单值
   */
  saveMethod?: (
    /** 表单数据 */
    data: Record<string, any>,
    /** 操作类型 */
    actionType: 'create' | 'update',
    /** 父级数据 */
    parentData?: Record<string, any>
  ) => any

  /**
   * 可用功能，不穿则对功能没有任何限制
   *
   * ## 用法
   * ```ts
   * // 只允许新增和更新
   * const features = ['create', 'update']
   * // 不允许新增，并且只有当行深度小于2时才允许新增子级，对其他功能不做限制
   * const features = {
   *   create: false,
   *   createChild: row => row.depth < 2
   * }
   * ```
   */
  features?:
    | Array<BatchEditFeature>
    | {
        [key in BatchEditFeature]?: boolean | ((row: TableRow) => boolean)
      }

  /**
   * 操作按钮的属性配置, 可以是action组件的任意属性
   * @example
   * ```ts
   * const actionsProps = {
   *   delete: {
   *     needConfirm: true,
   *     circle: false
   *   }
   * }
   * ```
   */
  actionsProps?: Partial<Record<BatchEditFeature, ActionProps>>
}

/** 批量编辑组件定义的事件 */
export interface BatchEditEmits extends TableEmits {
  /** 更新数据 */
  (e: 'update:data', value: Record<string, any>[]): void
}

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
