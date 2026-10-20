import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 胶囊单选组组件属性 */
export interface ChipGroupProps extends FormComponentProps {
  /** 绑定值，等于选中项的 value */
  modelValue?: any
  /** 选项列表 */
  items: Record<string, any>[]
  /**
   * 选项值字段名
   * @default 'value'
   */
  valueKey?: string
  /**
   * 标签文本字段名
   * @default 'label'
   */
  labelKey?: string
  /** 整组禁用 */
  disabled?: boolean
  /** 按项禁用：返回 true 的项不可选 */
  disabledItem?: (item: Record<string, any>) => boolean
}

/** 胶囊单选组组件事件 */
export interface ChipGroupEmits {
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项变化，payload 为完整选项对象 */
  (e: 'change', item: Record<string, any>): void
}

/** 胶囊单选组组件暴露的属性和方法(组件内部使用) */
export interface _ChipGroupExposed {}

/** 胶囊单选组组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ChipGroupExposed = DeconstructValue<_ChipGroupExposed>
