import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 表单组件属性 */
export interface FormProps extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  /** 表单数据 */
  model?: Record<string, any>
  // showModified?: boolean
  /** 表单项label宽度 */
  labelWidth?: string | number
  /** 表单项 label 位置 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export interface FormEmits {
  (e: 'field:change', field: string, value: any): void
}

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
  validate: (keys?: string[]) => Promise<boolean>
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}

export type FormExposed = DeconstructValue<_FormExposed>
