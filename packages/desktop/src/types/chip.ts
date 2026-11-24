import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface ChipProps extends FormComponentProps {
  value?: any
  /** 文本；未提供默认插槽时使用 */
  label?: string
  disabled?: boolean
  modelValue?: any
  /**
   * 原生 radio 的 name。
   * 同一组单选必须相同，方向键才会在组内移动；UChipGroup 会自动传入。
   */
  name?: string
}

export interface ChipEmits {
  (e: 'update:modelValue', value: any): void
}

export interface _ChipExposed {}

/** 胶囊单选组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ChipExposed = DeconstructValue<_ChipExposed>
