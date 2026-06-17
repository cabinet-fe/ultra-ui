import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 单选框组件属性 */
export interface RadioProps extends FormComponentProps {
  /** 单选框值 */
  value?: any
  /** 文本 */
  label?: string
  /**全部禁用 */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
