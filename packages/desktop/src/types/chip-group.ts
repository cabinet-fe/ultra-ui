import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface ChipGroupProps extends FormComponentProps {
  modelValue?: any
  items: Record<string, any>[]
  /**
   * @default 'value'
   */
  valueKey?: string
  /**
   * @default 'label'
   */
  labelKey?: string
  /** 整组禁用 */
  disabled?: boolean
  disabledItem?: (item: Record<string, any>) => boolean
}

export interface ChipGroupEmits {
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项变化，payload 为完整选项对象 */
  (e: 'change', item: Record<string, any>): void
}

export interface _ChipGroupExposed {}

/** 胶囊单选组组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ChipGroupExposed = DeconstructValue<_ChipGroupExposed>
