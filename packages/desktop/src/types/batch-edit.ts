import type { DeconstructValue } from '@veltra/utils'

import type { ActionProps } from './action'
import type { TableColumn, TableColumnSlotsScope, TableEmits, TableProps, TableRow } from './table'

export interface BatchEditColumn extends TableColumn {}

export type BatchEditFeature = 'create' | 'update' | 'delete' | 'view' | 'createChild'

export interface BatchEditStates {
  depth: number
  formVisible: boolean
  formActionType: 'create' | 'update' | 'view' | 'createChild'
  loading: boolean
  row?: TableRow
  parentRow?: TableRow
  indexPath: number[]
}

export interface BatchEditProps extends TableProps {
  /**
   * 表单数据
   * @description 与右侧 UForm 绑定的 reactive 对象
   */
  model?: Record<string, any>
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 只读模式 */
  readonly?: boolean
  /**
   * 表单交互模式
   * @description `'panel'`：右侧面板（默认）；`'dialog'`：编辑 / 新增 / 查看 / 添加子级时以弹框呈现表单
   * @default 'panel'
   */
  formMode?: 'panel' | 'dialog'
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
  labelWidth?: string | number
  /**
   * @returns 如果返回 false，则不删除
   */
  deleteMethod?: (data: Record<string, any>[]) => any
  /**
   * @description `quick` 模式下编辑行时实时写回，不调用此方法；新增时与 `normal` 模式一致
   * @returns 如果返回一个值，那么这个值会被插入，否则插入的为表单值
   */
  saveMethod?: (
    data: Record<string, any>,
    actionType: BatchEditStates['formActionType'],
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

export interface BatchEditEmits extends TableEmits {
  (e: 'update:data', value: Record<string, any>[]): void
  /** 点击底部「新增一行」 */
  (e: 'create'): void
  (e: 'create-prev', row: TableRow): void
  (e: 'create-next', row: TableRow): void
  (e: 'create-child', row: TableRow): void
}

export type BatchEditSlots = {
  form?: (props: {
    depth?: number
    row?: TableRow
    /** 新增时的父级行（createChild / 非根同级插入） */
    parentRow?: TableRow
    formActionType?: BatchEditStates['formActionType']
    index?: number
    indexes?: number[]
  }) => any

  header?: () => any
} & Partial<{ [key: `column:${string}`]: (props: TableColumnSlotsScope) => any }>

export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
