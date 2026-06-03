import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 开关组件属性 */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态 */
  modelValue?: boolean
  /** 打开时显示的文字 */
  activeText?: string
  /** 关闭时显示的文字 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

/** 开关组件暴露的属性和方法(组件内部使用) */
export interface _SwitchExposed {}

/** 开关组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SwitchExposed = DeconstructValue<_SwitchExposed>
