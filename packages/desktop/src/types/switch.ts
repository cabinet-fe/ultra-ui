import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface SwitchProps extends FormComponentProps {
  modelValue?: boolean
  activeText?: string
  inactiveText?: string
}

export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

export interface _SwitchExposed {}

/** 开关组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SwitchExposed = DeconstructValue<_SwitchExposed>
