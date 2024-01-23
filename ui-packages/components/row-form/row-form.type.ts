/** 表格编辑组件表头属性 */
export interface RowFormColumn {
  /** 键值 */
  key: string
  /** 名称 */
  name: string
  /** 校验规则 */
  rule?: ValidatorRule
  /** 是否校验状态 */
  isValidator?: Boolean
}

/** 表格编辑器校验的属性 */
export interface ValidatorRule {
  /** 是否必填 */
  require?: Boolean
  /** 预设校验 可以跟require一起使用，但不能跟match一起用 */
  default?: 'id' | 'phone'
  /** 正则 */
  match?: String
  /** 是否校验状态 */
  isValidator: Boolean
}

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
}

/** 表格编辑组件组件定义的事件 */
export interface RowFormEmits {
  (e: 'update:modelValue', value: any[]): void
  /** 校验 */
  (e: 'validator'): void
  (e: 'save', value: Record<string, any>): void
}

/** 表格编辑组件组件暴露的属性和方法(组件内部使用) */
export interface _RowFormExposed {}

/** 表格编辑组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface RowFormExposed {
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
