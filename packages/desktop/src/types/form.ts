import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface FormProps extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  model?: Record<string, any>
  /** 开启后，字段当前值与基准值不同时，在控件下方展示「变更前」 */
  showModified?: boolean
  /** 「变更前」标签文案，默认「变更前：」 */
  modifiedLabel?: string
  /** 变更前基准数据；未传时回退到 model 引用首次传入时的快照（与 reset 一致） */
  initialModel?: Record<string, any>
  labelWidth?: string | number
  labelPosition?: 'top' | 'left'
  noTips?: boolean
  readonly?: boolean
  disabled?: boolean
}

export interface FormEmits {
  /** model 字段值更新，含编程写入 */
  (e: 'field:update', field: string, value: any): void
}

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
  validate: (keys?: string[]) => Promise<boolean>
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}

export type FormExposed = DeconstructValue<_FormExposed>
