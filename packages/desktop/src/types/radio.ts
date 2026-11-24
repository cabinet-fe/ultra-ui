import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface RadioProps extends FormComponentProps {
  value?: any
  label?: string
  disabled?: boolean
  modelValue?: any
}

export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}

export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
