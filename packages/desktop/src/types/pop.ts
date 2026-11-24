import type { DeconstructValue } from '@veltra/utils'

export interface PopProps {
  modelValue?: string
}

export interface PopEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _PopExposed {}

/** 气泡弹框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopExposed = DeconstructValue<_PopExposed>
