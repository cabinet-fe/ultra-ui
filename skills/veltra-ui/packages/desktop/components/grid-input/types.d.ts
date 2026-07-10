import type { DeconstructValue } from '@veltra/utils'

/** 网格输入框组件属性 */
export interface GridInputProps {
  modelValue?: string
  /** 格子数量 */
  length?: number
  /**
   * 是否允许输入 0
   * @description 验证码场景通常开启；组织编码结构等场景关闭（如 3-3-2）
   * @default false
   */
  zero?: boolean
  /** 格子之间的分隔符 */
  separator?: string
}

/** 网格输入框组件定义的事件 */
export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

/** 网格输入框组件暴露的属性和方法(组件内部使用) */
export interface _GridInputExposed {
  clear: () => void
}

/** 网格输入框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridInputExposed = DeconstructValue<_GridInputExposed>
