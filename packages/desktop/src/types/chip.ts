import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 胶囊单选组件属性 */
export interface ChipProps extends FormComponentProps {
  /** 选项值 */
  value?: any
  /** 文本；未提供默认插槽时使用 */
  label?: string
  /** 禁用 */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
  /**
   * 原生 radio 的 name。
   * 同一组单选必须相同，方向键才会在组内移动；UChipGroup 会自动传入。
   */
  name?: string
}

/** 胶囊单选组件事件 */
export interface ChipEmits {
  (e: 'update:modelValue', value: any): void
}

/** 胶囊单选组件暴露的属性和方法(组件内部使用) */
export interface _ChipExposed {}

/** 胶囊单选组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ChipExposed = DeconstructValue<_ChipExposed>
