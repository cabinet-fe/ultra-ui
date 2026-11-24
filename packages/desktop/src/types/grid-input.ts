import type { DeconstructValue } from '@veltra/utils'

export interface GridInputProps {
  modelValue?: string
  length?: number
  /**
   * 是否允许输入 0
   * @description 验证码场景通常开启；组织编码结构等场景关闭（如 3-3-2）
   * @default false
   */
  zero?: boolean
  separator?: string
}

export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

export interface _GridInputExposed {
  clear: () => void
}

/** 网格输入框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridInputExposed = DeconstructValue<_GridInputExposed>
