import type { ValidateRule } from '@ui/types/utils/form/validate'
import type { ModelRef } from 'vue'

/** 表格编辑组件表头属性 */
export interface RowFormColumn {
  /** 键值 */
  key: string
  /** 名称 */
  name: string
  width?: number
  /** 校验规则 */
  rules?: RowFormValidateRule
}

export interface RowFormValidateRule extends ValidateRule {}

/** 表格编辑组件组件属性 */
export interface RowFormProps<T> {
  /** 是否禁止编辑 */
  disabled?: boolean
  /** 双向绑定的值 */
  modelValue: T[]
  /** columns */
  columns: RowFormColumn[]
  /** 是否是tree */
  tree?: boolean
  /** childrenKey='children' */
  childrenKey?: string
  border?: boolean
}

/** body里面的操作栏 */
export interface RowFormOperation {
  key: string
  name: string
}

/** 每一条的内容 */
// export interface rowType {
//   // children: rowType[];
//   [key: string]: any
// }

export interface Row<Data extends Record<string, any>> {
  data: Data
  index: number
  isLeaf: boolean
  expanded: boolean
  loading: boolean
  uid: number
  depth: number
}

/** 表格编辑组件组件定义的事件 */
export interface RowFormEmits<T> {
  (e: 'update:modelValue', value: T[]): void
  /** 校验 */
  (e: 'validator'): void
  (e: 'save', value: Record<string, any>): void
}

/** row-form-item-body的事件 */
export interface RowFormItemEmits {
  (
    e: 'click',
    value: Event,
    index: number,
    dataItem: Record<string, any>,
    columnsItem: RowFormColumn
  ): void
  (e: 'delete', value: Record<string, any>[], index: number): void
  (e: 'insert', value: Record<string, any>[], index: number): void
  (
    e: 'contextmenu',
    value: MouseEvent,
    index: number,
    dataItem?: Record<string, any>
  ): void
}

/** 表格编辑组件组件暴露的属性和方法(组件内部使用) */
export interface _RowFormExposed {}

/** 表格编辑组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface RowFormExposed {
  /** 获取值 */
  getValue(): void

  delete(index: number): void
  delete(indexes: number[]): void

  insert(index: number): void

  validate(): Promise<boolean>
}

/** row-form-button按钮  */
export interface RowFormType {
  /** 点击事件 */
  (name: 'click'): void
}

/** 行表单组件暴露的属性和方法(组件内部使用) */
export interface _RowFormExposed {}

/** 行表单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface RowFormExposed {}
