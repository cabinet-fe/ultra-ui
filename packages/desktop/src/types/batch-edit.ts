import type { DeconstructValue } from '@veltra/utils'

import type { ActionProps } from './action'
import type { TableColumn, TableColumnSlotsScope, TableEmits, TableProps, TableRow } from './table'

/** 批量编辑列 */
export interface BatchEditColumn extends TableColumn {}

export type BatchEditFeature = 'create' | 'update' | 'delete' | 'view' | 'createChild'

export type BatchEditFormStatus = 'hidden'

/** 批量编辑状态 */
export interface BatchEditStates {
  /** 层级 */
  depth: number
  /** 表单可见性 */
  formVisible: boolean
  /** 表单操作类型 */
  formActionType: 'create' | 'update' | 'view' | 'createChild'
  /** 加载状态 */
  loading: boolean
  /** 当前编辑行 */
  row?: TableRow
  /** 当前编辑或者新增的父级行 */
  parentRow?: TableRow
  /** 行索引路径， */
  indexPath: number[]
}

/** 批量编辑组件属性 */
export interface BatchEditProps extends TableProps {
  /**
   * 表单数据
   * @description 与右侧 UForm 绑定的 reactive 对象
   */
  model?: Record<string, any>
  /** 表格标题 */
  title?: string
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 只读模式 */
  readonly?: boolean
  /**
   * 开启快速编辑
   * @description 开启后，编辑行时表单实时写回 `row.data`（经 `model` 中转），且不调用 `saveMethod`
   */
  quickEdit?: boolean
  /**
   * 新增前的钩子
   * @description 仅作用于 create 类操作，在保存时调用。可直接修改传入的 draft 对象
   */
  beforeCreate?: (
    data: Record<string, any>,
    parentData?: Record<string, any>
  ) => void | Promise<void>
  /** label的宽度 */
  labelWidth?: string | number
  /**
   * 删除方法
   * @description 删除时调用。如果返回 false，则不删除
   * @returns 如果返回 false，则不删除
   */
  deleteMethod?: (data: Record<string, any>[]) => any
  /**
   * 保存方法
   * @description 保存时调用。`quick` 模式下编辑行时实时写回，不调用此方法；新增时与 `normal` 模式一致
   * @returns 如果返回一个值，那么这个值会被插入，否则插入的为表单值
   */
  saveMethod?: (
    /** 表单数据 */
    data: Record<string, any>,
    /** 操作类型 */
    actionType: BatchEditStates['formActionType'],
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
  /** 点击底部「新增一行」 */
  (e: 'create'): void
  /** 点击「在上方插入」 */
  (e: 'create-prev', row: TableRow): void
  /** 点击「在下方插入」 */
  (e: 'create-next', row: TableRow): void
  /** 点击「添加子级」，参数为父级行 */
  (e: 'create-child', row: TableRow): void
}

export type BatchEditSlots = {
  form?: (props: {
    /** 当前编辑的层级 */
    depth?: number
    /** 当前编辑的行 */
    row?: TableRow
    /** 新增时的父级行（createChild / 非根同级插入） */
    parentRow?: TableRow
    /** 当前表单操作类型 */
    formActionType?: BatchEditStates['formActionType']
    /** 当前编辑的行索引 */
    index?: number
    /** 操作的目标行索引路径 */
    indexes?: number[]
  }) => any

  header?: () => any
} & Partial<{ [key: `column:${string}`]: (props: TableColumnSlotsScope) => any }>

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
